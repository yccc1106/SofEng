# MeetU

MeetU 正在迁移为 React / Next.js 前端与 Spring Boot 独立后端。迁移期间，尚未切换的业务继续由现有 Next.js API 提供。

## 快速开始

1. **启动数据库**

   在 **5433** 端口启动 PostgreSQL（推荐使用 Docker）：

   ```bash
   docker compose up -d

   # 用完记得关
   # docker compose down
   ```

2. **初始化现有前端所需数据**

   ```bash
   pnpm prisma generate
   pnpm prisma db push
   pnpm prisma db seed
   ```

3. **启动 Java 后端**

   本机需要 Java 17 与 Maven 3.9+：

   ```bash
   cd backend
   mvn spring-boot:run
   ```

   默认连接 `localhost:5433/meetu`。可通过 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 和 `SERVER_PORT` 覆盖配置。

   启动后可访问：

   - 服务检查：<http://localhost:8080/api/system/ping>
   - 数据库健康检查：<http://localhost:8080/actuator/health>
   - OpenAPI：<http://localhost:8080/v3/api-docs>
   - Swagger UI：<http://localhost:8080/swagger-ui.html>

4. **启动前端开发服务器**

   ```bash
   pnpm dev

   # 或

   pnpm build && pnpm start
   ```

前端默认访问 <http://localhost:3000>。

## 后端验证

```bash
cd backend
mvn test
mvn verify
```

Flyway 在已有 Prisma 数据库上使用版本 `1` 建立迁移基线；业务表结构仍由 Prisma 暂时维护，后续 Java 业务迁移从 `V2` 开始编写数据库迁移。前端全部切换并完成验证前，不删除现有 Next.js API、NextAuth 或 Prisma 实现。
