package types

import "time"

// ChatMessage 聊天消息结构
type ChatMessage struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	SenderID  string    `json:"senderId"`
	Sender    *UserInfo `json:"sender"`
	ReceiverID string   `json:"receiverId,omitempty"`
	TeamID    string    `json:"teamId,omitempty"`
	CategoryID string   `json:"categoryId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// UserInfo 用户信息
type UserInfo struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Image string `json:"image"`
}

// RedisMessage Redis 发布的消息格式
type RedisMessage struct {
	Room    string      `json:"room"`
	Message ChatMessage `json:"message"`
}

// ClientMessage 客户端发送的消息
type ClientMessage struct {
	Type      string `json:"type"` // join, leave
	Room      string `json:"room"`
	RoomType  string `json:"roomType"` // dm, team, interest
	TargetID  string `json:"targetId,omitempty"`
}

// RoomType 房间类型
type RoomType string

const (
	RoomTypeDM       RoomType = "dm"
	RoomTypeTeam     RoomType = "team"
	RoomTypeInterest RoomType = "interest"
)

// GenerateRoomName 生成房间名称
func GenerateRoomName(roomType RoomType, id1, id2 string) string {
	switch roomType {
	case RoomTypeDM:
		// 私聊房间：按字母顺序排序确保唯一
		if id1 > id2 {
			id1, id2 = id2, id1
		}
		return "dm:" + id1 + "_" + id2
	case RoomTypeTeam:
		return "team:" + id1
	case RoomTypeInterest:
		return "interest:" + id1
	default:
		return ""
	}
}
