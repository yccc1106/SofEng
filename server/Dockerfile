# 多阶段构建
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装 git（用于 go mod download）
RUN apk add --no-cache git

# 先复制 go.mod 和 go.sum 以利用缓存
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建二进制文件
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 生产镜像
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/main .

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8081

CMD ["./main"]
