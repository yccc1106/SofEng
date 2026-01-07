package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"meetu-ws/internal/config"
	"meetu-ws/internal/handler"
)

func main() {
	// 加载配置
	cfg := config.Load()
	log.Printf("Starting WebSocket server on port %s", cfg.WSPort)

	// 创建 Redis 处理器
	redisHandler, err := handler.NewRedisHandler(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisHandler.Close()
	log.Println("Connected to Redis")

	// 创建 WebSocket 处理器
	wsHandler := handler.NewWebSocketHandler(redisHandler, cfg.JWTSecret)

	// 创建 HTTP 服务器
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", wsHandler.HandleConnection)

	// 健康检查端点
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	server := &http.Server{
		Addr:    ":" + cfg.WSPort,
		Handler: mux,
	}

	// 启动 Redis 监听器
	ctx, cancel := context.WithCancel(context.Background())
	go wsHandler.StartRedisListener(ctx)

	// 优雅关闭
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down server...")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), time.Second*10)
		defer shutdownCancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	// 启动服务器
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}

	fmt.Println("Server stopped")
}
