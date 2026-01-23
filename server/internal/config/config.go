package config

import (
	"os"
	"strconv"
)

type Config struct {
	RedisURL  string
	JWTSecret string
	WSPort    string
}

func Load() *Config {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = os.Getenv("NEXTAUTH_SECRET")
	}
	if jwtSecret == "" {
		jwtSecret = "default-secret-change-in-production"
	}

	wsPort := os.Getenv("WS_PORT")
	if wsPort == "" {
		wsPort = "8081"
	}

	return &Config{
		RedisURL:  redisURL,
		JWTSecret: jwtSecret,
		WSPort:    wsPort,
	}
}

// GetEnvInt 获取环境变量整数
func GetEnvInt(key string, defaultValue int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue}
	v, err := strconv.Atoi(val)
	if err != nil {
		return defaultValue
	}
	return v
}
