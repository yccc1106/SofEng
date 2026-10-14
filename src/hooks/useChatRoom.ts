'use client';

import { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
    id: string;
    content: string;
    senderId: string;
    receiverId: string | null;
    teamId: string | null;
    categoryId: string | null;
    isRead: boolean;
    sender: { id: string; name: string | null; image: string | null };
    createdAt: string;
}
export type ChatTarget = { userId: string } | { teamId: string } | { categoryId: string };
type ChatResponse<T> = { success: boolean; data?: T; message?: string; error?: string };
type Status = 'connecting' | 'live' | 'reconnecting' | 'offline';

function params(target: ChatTarget) { return new URLSearchParams(target).toString(); }
function merged(current: ChatMessage[], incoming: ChatMessage[]) {
    const byId = new Map(current.map(item => [item.id, item]));
    for (const item of incoming) byId.set(item.id, item);
    return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
function socketUrl() {
    if (process.env.NEXT_PUBLIC_JAVA_WS_URL) return process.env.NEXT_PUBLIC_JAVA_WS_URL;
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080/api/chat/ws`;
}
async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result: ChatResponse<T> = await response.json();
    if (!response.ok || !result.success || result.data === undefined)
        throw new Error(result.message || result.error || 'Chat request failed');
    return result.data;
}

export function useChatRoom(target: ChatTarget | null, viewerId?: string) {
    const key = target ? params(target) : '';
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasOlder, setHasOlder] = useState(false);
    const [status, setStatus] = useState<Status>('offline');
    const [error, setError] = useState<string | null>(null);
    const latestId = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!target) { setMessages([]); setLoading(false); setHasOlder(false); setStatus('offline'); return; }
        let active = true;
        let socket: WebSocket | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;
        let heartbeat: ReturnType<typeof setInterval> | undefined;
        let retries = 0;
        let terminalError = false;
        const recordRead = async () => {
            try { await fetch('/java/chat/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) }); }
            catch { /* The next visit can retry. */ }
        };
        const page = async (before?: string) => api<ChatMessage[]>(`/java/chat?${key}${before ? `&before=${encodeURIComponent(before)}` : ''}`);
        const sync = async (initial: boolean) => {
            try {
                const first = await page();
                if (!active) return;
                if (initial) {
                    setMessages(current => {
                        const next = merged(current, first);
                        latestId.current = next.at(-1)?.id;
                        return next;
                    });
                    setHasOlder(first.length === 100);
                }
                else {
                    let batch = first;
                    const lastKnown = latestId.current;
                    setMessages(current => {
                        const next = merged(current, batch);
                        latestId.current = next.at(-1)?.id;
                        return next;
                    });
                    while (active && lastKnown && batch.length === 100 && !batch.some(item => item.id === lastKnown)) {
                        batch = await page(batch[0].id);
                        setMessages(current => merged(current, batch));
                    }
                }
                await recordRead();
                setError(null);
            } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load messages'); }
            finally { if (active && initial) setLoading(false); }
        };
        const connect = () => {
            if (!active) return;
            setStatus(retries ? 'reconnecting' : 'connecting');
            socket = new WebSocket(socketUrl());
            socket.onopen = () => {
                if (!active || !socket) return;
                socket.send(JSON.stringify({ event: 'join', ...target }));
                setStatus('live');
                retries = 0;
                void sync(false);
                heartbeat = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ event: 'ping' })); }, 30000);
            };
            socket.onmessage = event => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'new:message' && data.data) {
                        const item = data.data as ChatMessage;
                        setMessages(current => {
                            const next = merged(current, [item]);
                            latestId.current = next.at(-1)?.id;
                            return next;
                        });
                        if (item.senderId !== viewerId) void recordRead();
                    } else if (data.event === 'read') {
                        if (data.readerId !== viewerId)
                            setMessages(current => current.map(item => item.senderId === viewerId ? { ...item, isRead: true } : item));
                    } else if (data.event === 'error') {
                        setError(data.message || 'Unable to join chat');
                        terminalError = true;
                        socket?.close();
                    }
                } catch { setError('Invalid real-time message'); }
            };
            socket.onclose = () => {
                if (heartbeat) clearInterval(heartbeat);
                if (!active) return;
                if (terminalError) { setStatus('offline'); return; }
                const delay = retries < 5 ? Math.min(1000 * 2 ** retries, 16000) : 30000;
                retries += 1;
                setStatus(retries > 5 ? 'offline' : 'reconnecting');
                retryTimer = setTimeout(connect, delay);
            };
            socket.onerror = () => socket?.close();
        };
        setMessages([]); setError(null); setLoading(true); setHasOlder(false); setStatus('connecting'); latestId.current = undefined;
        void sync(true);
        connect();
        return () => { active = false; if (retryTimer) clearTimeout(retryTimer); if (heartbeat) clearInterval(heartbeat); socket?.close(); };
    }, [key, viewerId]);

    const send = async (content: string) => {
        if (!target) throw new Error('Select a conversation');
        const recipient = 'userId' in target ? { receiverId: target.userId } : target;
        const sent = await api<ChatMessage>('/java/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...recipient, content })
        });
        setMessages(current => {
            const next = merged(current, [sent]);
            latestId.current = next.at(-1)?.id;
            return next;
        });
        return sent;
    };
    const loadOlder = async () => {
        if (!target || loadingOlder || !hasOlder || !messages.length) return 0;
        setLoadingOlder(true);
        try {
            const older = await api<ChatMessage[]>(`/java/chat?${key}&before=${encodeURIComponent(messages[0].id)}`);
            setMessages(current => merged(current, older)); setHasOlder(older.length === 100);
            return older.length;
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load history'); }
        finally { setLoadingOlder(false); }
        return 0;
    };
    return { messages, loading, loadingOlder, hasOlder, status, error, send, loadOlder };
}
