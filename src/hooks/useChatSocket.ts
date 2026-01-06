'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, ChatMessage } from '@/lib/websocket';

interface UseChatSocketOptions {
  room: string;
  roomType: 'dm' | 'team' | 'interest';
  token: string;
  onNewMessage?: (message: ChatMessage) => void;
  enabled?: boolean;
}

export function useChatSocket({
  room,
  roomType,
  token,
  onNewMessage,
  enabled = true,
}: UseChatSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);

  // 初始化 WebSocket 客户端
  useEffect(() => {
    if (!enabled || !token || !room) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8081';

    const client = new WebSocketClient({
      url: wsUrl,
      token,
      onConnect: () => {
        setIsConnected(true);
        setError(null);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onError: () => {
        setError('WebSocket connection error');
      },
      onMessage: (data) => {
        if (data.type === 'new:message' && data.message) {
          onNewMessage?.(data.message);
        }
      },
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [enabled, token, room, onNewMessage]);

  // 加入/离开房间
  useEffect(() => {
    if (!clientRef.current || !isConnected || !room) {
      return;
    }

    clientRef.current.joinRoom(room, roomType);

    return () => {
      if (clientRef.current) {
        clientRef.current.leaveRoom(room);
      }
    };
  }, [isConnected, room, roomType]);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current.connect();
    }
  }, []);

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
      // 私聊房间：按字母顺序排序确保唯一
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
