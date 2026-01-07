package handler

import (
	"context"
	"encoding/json"
	"log"

	"github.com/go-redis/redis/v8"
	"meetu-ws/internal/types"
)

// RedisHandler 处理 Redis Pub/Sub
type RedisHandler struct {
	client    *redis.Client
	pubsub    *redis.PubSub
	broadcast chan types.RedisMessage
}

// NewRedisHandler 创建新的 Redis 处理器
func NewRedisHandler(redisURL string) (*RedisHandler, error) {
	// 解析 Redis URL 获取地址
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opt)

	// 测试连接
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisHandler{
		client:    client,
		broadcast: make(chan types.RedisMessage, 100),
	}, nil
}

// Publish 发布消息到频道
func (r *RedisHandler) Publish(ctx context.Context, channel string, message types.RedisMessage) error {
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}
	return r.client.Publish(ctx, channel, data).Err()
}

// Subscribe 订阅频道
func (r *RedisHandler) Subscribe(ctx context.Context, channel string) error {
	pubsub := r.client.Subscribe(ctx, channel)
	_, err := pubsub.Receive(ctx)
	if err != nil {
		return err
	}
	r.pubsub = pubsub
	return nil
}

// StartConsuming 开始消费消息
func (r *RedisHandler) StartConsuming(ctx context.Context, channel string, onMessage func(types.RedisMessage)) {
	ch := r.pubsub.Channel()
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			var redisMsg types.RedisMessage
			if err := json.Unmarshal([]byte(msg.Payload), &redisMsg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}
			onMessage(redisMsg)
		}
	}
}

// Close 关闭连接
func (r *RedisHandler) Close() error {
	if r.pubsub != nil {
		r.pubsub.Close()
	}
	return r.client.Close()
}

// GetClient 返回 Redis 客户端（用于测试）
func (r *RedisHandler) GetClient() *redis.Client {
	return r.client
}
