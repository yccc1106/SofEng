package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"meetu-ws/internal/middleware"
	"meetu-ws/internal/types"
)

// WebSocketHandler 处理 WebSocket 连接
type WebSocketHandler struct {
	upgrader    websocket.Upgrader
	clients     map[string]*Client
	rooms       map[string]map[string]*Client // room -> clientID -> Client
	mu          sync.RWMutex
	redisHandler *RedisHandler
	jwtSecret   string
}

// Client WebSocket 客户端
type Client struct {
	ID     string
	UserID string
	User   *middleware.AuthenticatedUser
	Conn   *websocket.Conn
	Send   chan []byte
}

// NewWebSocketHandler 创建新的 WebSocket 处理器
func NewWebSocketHandler(redisHandler *RedisHandler, jwtSecret string) *WebSocketHandler {
	return &WebSocketHandler{
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				// TODO: 生产环境需要检查 Origin
				return true
			},
		},
		clients:     make(map[string]*Client),
		rooms:       make(map[string]map[string]*Client),
		redisHandler: redisHandler,
		jwtSecret:   jwtSecret,
	}
}

// HandleConnection 处理新的 WebSocket 连接
func (h *WebSocketHandler) HandleConnection(w http.ResponseWriter, r *http.Request) {
	// 从查询参数或 header 获取 token
	token := r.URL.Query().Get("token")
	if token == "" {
		token = middleware.ExtractToken(r)
	}
	if token == "" {
		log.Printf("Missing token from %s", r.RemoteAddr)
	}

	user, err := middleware.ValidateToken(token, h.jwtSecret)
	if err != nil {
		log.Printf("Auth failed: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 升级连接
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Upgrade error: %v", err)
		return
	}

	// 创建客户端
	client := &Client{
		ID:   fmt.Sprintf("%s-%d", user.ID, time.Now().UnixNano()),
		UserID: user.ID,
		User: user,
		Conn: conn,
		Send: make(chan []byte, 256),
	}
	log.Printf("WebSocket connected: user=%s client=%s addr=%s", user.ID, client.ID, r.RemoteAddr)

	h.mu.Lock()
	h.clients[client.ID] = client
	h.mu.Unlock()

	// 启动读写协程
	go client.writePump(h)
	go client.readPump(h, r.Context())
}

// readPump 从 WebSocket 读取消息
func (c *Client) readPump(h *WebSocketHandler, ctx context.Context) {
	defer func() {
		h.mu.Lock()
		delete(h.clients, c.ID)
		// 从所有房间移除
		for _, room := range h.rooms {
			delete(room, c.ID)
		}
		h.mu.Unlock()
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var clientMsg types.ClientMessage
		if err := json.Unmarshal(message, &clientMsg); err != nil {
			log.Printf("Error unmarshaling client message: %v", err)
			continue
		}

		h.handleClientMessage(c, clientMsg)
	}
}

// writePump 向 WebSocket 写入消息
func (c *Client) writePump(h *WebSocketHandler) {
	ticker := time.NewTicker(time.Second * 30)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(time.Second * 10))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Write error: %v", err)
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(time.Second * 10))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleClientMessage 处理客户端消息
func (h *WebSocketHandler) handleClientMessage(client *Client, msg types.ClientMessage) {
	switch msg.Type {
	case "join":
		h.joinRoom(client, msg.Room)
	case "leave":
		h.leaveRoom(client, msg.Room)
	}
}

// joinRoom 加入房间
func (h *WebSocketHandler) joinRoom(client *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.rooms[room]; !ok {
		h.rooms[room] = make(map[string]*Client)
	}
	h.rooms[room][client.ID] = client
	log.Printf("User %s joined room: %s", client.User.Name, room)
}

// leaveRoom 离开房间
func (h *WebSocketHandler) leaveRoom(client *Client, room string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if roomClients, ok := h.rooms[room]; ok {
		delete(roomClients, client.ID)
		if len(roomClients) == 0 {
			delete(h.rooms, room)
		}
	}
	log.Printf("User %s left room: %s", client.User.Name, room)
}

// BroadcastToRoom 向房间广播消息
func (h *WebSocketHandler) BroadcastToRoom(room string, message interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	if roomClients, ok := h.rooms[room]; ok {
		for _, client := range roomClients {
			select {
			case client.Send <- data:
			default:
				// 发送缓冲区满，跳过
			}
		}
	}
}

// StartRedisListener 开始监听 Redis 消息
func (h *WebSocketHandler) StartRedisListener(ctx context.Context) {
	if h.redisHandler == nil {
		return
	}

	err := h.redisHandler.Subscribe(ctx, "chat:message")
	if err != nil {
		log.Printf("Failed to subscribe to Redis: %v", err)
		return
	}

	h.redisHandler.StartConsuming(ctx, "chat:message", func(msg types.RedisMessage) {
		h.BroadcastToRoom(msg.Room, map[string]interface{}{
			"type":    "new:message",
			"message": msg.Message,
		})
	})
}
