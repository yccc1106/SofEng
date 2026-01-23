// WebSocket 客户端封装
// TODO: 后续可以考虑使用 socket.io-client 以获得自动重连等功能

export interface ChatMessage {
  id: string;
  content: string;
  type: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    image: string;
  };
  receiverId?: string;
  teamId?: string;
  categoryId?: string;
  createdAt: string;
}

export interface WebSocketConfig {
  url: string;
  token: string;
  onMessage?: (data: { type: string; message: ChatMessage }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

type RoomType = 'dm' | 'team' | 'interest';

function normalizeWsUrl(rawUrl: string): string {
  if (rawUrl.startsWith('ws://') || rawUrl.startsWith('wss://')) {
    return rawUrl;
  }
  if (rawUrl.startsWith('https://')) {
    return rawUrl.replace('https://', 'wss://');
  }
  if (rawUrl.startsWith('http://')) {
    return rawUrl.replace('http://', 'ws://');
  }
  return rawUrl;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentRoom: string | null = null;
  private currentRoomType: RoomType | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const baseUrl = normalizeWsUrl(this.config.url);
    const url = `${baseUrl}/ws?token=${this.config.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.config.onConnect?.();

      // 如果之前有加入房间，重新加入
      if (this.currentRoom && this.currentRoomType) {
        this.joinRoom(this.currentRoom, this.currentRoomType);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Received:', data);

        if (data.type === 'new:message') {
          this.config.onMessage?.(data);
        }
      } catch (error) {
        console.error('[WS] Parse error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.stopHeartbeat();
      this.config.onDisconnect?.();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
      this.config.onError?.(error);
    };
  }

  joinRoom(room: string, roomType: RoomType): void {
    this.currentRoom = room;
    this.currentRoomType = roomType;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join',
        room,
        roomType,
      }));
      console.log('[WS] Joined room:', room);
    }
  }

  leaveRoom(room: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave',
        room,
      }));
      console.log('[WS] Left room:', room);
    }
    this.currentRoom = null;
    this.currentRoomType = null;
  }

  private startHeartbeat(): void {
    // 每30秒发送心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WS] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.currentRoom) {
      this.leaveRoom(this.currentRoom);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 单例模式获取 WebSocketClient
let clientInstance: WebSocketClient | null = null;

export function getWebSocketClient(config: WebSocketConfig): WebSocketClient {
  if (!clientInstance) {
    clientInstance = new WebSocketClient(config);
  }
  return clientInstance;
}
