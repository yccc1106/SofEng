'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, ChatMessage } from '@/lib/websocket';

interface UseChatSocketOptions {
  room: string;
  roomType: 'dm' | 'team' | 'interest';
  userId: string;
  onNewMessage?: (message: ChatMessage) => void;
  enabled?: boolean;
}

export function useChatSocket({
  room,
  roomType,
  userId,
  onNewMessage,
  enabled = true,
}: UseChatSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);
  const wsTokenRef = useRef<string | null>(null);
  const onMessageRef = useRef(onNewMessage);

  // 保持 onMessageRef 最新
  useEffect(() => {
    onMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // 获取 JWT token
  const getWSToken = useCallback(async () => {
    try {
      const res = await fetch('/api/ws-token');
      const data = await res.json();
      if (data.token) {
        wsTokenRef.current = data.token;
        return data.token;
      }
    } catch (err) {
      console.error('Failed to get WS token:', err);
    }
    return null;
  }, []);

  // 初始化 WebSocket 客户端
  useEffect(() => {
    if (!enabled || !userId || !room) {
      return;
    }

    let mounted = true;

    const initWebSocket = async () => {
      const token = await getWSToken();
      if (!mounted || !token) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8081';

      const client = new WebSocketClient({
        url: wsUrl,
        token,
        onConnect: () => {
          if (mounted) {
            setIsConnected(true);
            setError(null);
          }
        },
        onDisconnect: () => {
          if (mounted) {
            setIsConnected(false);
          }
        },
        onError: () => {
          if (mounted) {
            setError('WebSocket connection error');
          }
        },
        onMessage: (data) => {
          if (mounted && data.type === 'new:message' && data.message) {
            console.log('[WS] Received new message:', data.message);
            onMessageRef.current?.(data.message);
          }
        },
      });

      clientRef.current = client;
      client.connect();
    };

    initWebSocket();

    return () => {
      mounted = false;
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [enabled, userId, room, getWSToken]);

  // 加入/离开房间
  useEffect(() => {
    if (!clientRef.current || !isConnected || !room) {
      return;
    }

    console.log('[WS] Joining room:', room, roomType);
    clientRef.current.joinRoom(room, roomType);

    return () => {
      if (clientRef.current && clientRef.current.isConnected) {
        console.log('[WS] Leaving room:', room);
        clientRef.current.leaveRoom(room);
      }
    };
  }, [isConnected, room, roomType]);

  const reconnect = useCallback(async () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      await getWSToken();
      if (wsTokenRef.current) {
        clientRef.current.connect();
      }
    }
  }, [getWSToken]);

  return {
    isConnected,
    error,
    reconnect,
  };
}

// 生成房间名称的工具函数
export function generateRoomName(
  roomType: 'dm' | 'team' | 'interest',
  id1: string,
  id2?: string
): string {
  switch (roomType) {
    case 'dm':
      const sorted = [id1, id2!].sort();
      return `dm:${sorted[0]}_${sorted[1]}`;
    case 'team':
      return `team:${id1}`;
    case 'interest':
      return `interest:${id1}`;
    default:
      return '';
  }
}
