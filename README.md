# MeetU

MeetU 正在迁移为 React / Next.js 前端与 Spring Boot 独立后端。Java 后端按 Controller → Service 接口 → ServiceImpl → MyBatis Mapper 分层，使用 PostgreSQL。迁移期间，尚未切换的业务继续由现有 Next.js API 提供。

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

   默认连接 `localhost:5433/meetu`。可通过 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 和 `SERVER_PORT` 覆盖配置。开发环境默认允许 `http://localhost:3000` 发起会话写请求；部署到其他前端地址时设置 `FRONTEND_ORIGIN`，使用 HTTPS 时设置 `SESSION_COOKIE_SECURE=true`。

   启动后可访问：

   - 服务检查：<http://localhost:8080/api/system/ping>
   - 数据库健康检查：<http://localhost:8080/actuator/health>
   - OpenAPI：<http://localhost:8080/v3/api-docs>
   - Swagger UI：<http://localhost:8080/swagger-ui.html>

4. **启动前端开发服务器**

   ```bash
   pnpm dev

   # Java 服务地址不同于默认的 localhost:8080 时：
   # JAVA_BACKEND_URL=http://localhost:18080 pnpm dev

   # 或

   pnpm build && pnpm start
   ```

前端默认访问 <http://localhost:3000>。注册、登录及个人资料页面通过 `/java/*` 代理调用 Spring Boot 的 `/api/*`；前端与 Java 后端必须同时运行。迁移期登录还会建立 NextAuth 会话，供尚未迁移的页面和接口使用。退出时会注销两套会话。账号被冻结、封禁或删除后，Java 会话和旧 NextAuth 服务端会话均会失效。

## 第三阶段接口

- `POST /api/users`：邮箱、昵称和密码注册，密码至少 8 位；返回不含密码的用户资料。
- `POST /api/auth/login`、`POST /api/auth/logout`：建立或注销 Java 服务端会话。
- `GET /api/users/profile`、`PUT /api/users/profile`：仅操作当前登录用户；可编辑字段为昵称、学校、专业、年级和简介。
- Java 会话使用 `HttpOnly`、`SameSite=Lax` Cookie。写请求校验浏览器 `Origin`；生产环境必须使用 HTTPS 并启用安全 Cookie。单体后端重启后内存会话失效，用户需重新登录。

迁移期旧 Next.js API Routes 仍存在，尚未迁移的管理接口安全问题见 `MIGRATION_BASELINE.md` 第 12 节；上线到不可信网络前需完成后续迁移。登录与注册限流、全量旧接口清理及部署安全验收仍在后续阶段。

## 第四阶段接口

- `GET /api/category`、`GET /api/category/{id}`：公开分类查询，统一响应包装。
- `GET /api/posts`：公开浏览已发布帖子；登录作者也能看到自己的待审或被拒帖子。支持 `categoryId`、`page`、`pageSize`，兼容旧 `limit`，每页最多 100 条，返回 `pagination`。
- `POST /api/posts`：登录用户发布帖子，新帖状态为 `AUDITING`，审核通过后才对其他用户可见。
- `GET/POST /api/posts/{id}/comments`：已发布帖子的评论查询与发表。
- `POST /api/posts/{id}/like`、`POST /api/posts/{id}/collect`：已发布帖子点赞、收藏，再次调用取消。

前端分类、帖子和互动页面已切换到 `/java/*`；原 Next.js 分类与帖子接口已移除。现有 Next.js 审核页面可处理待审帖子，完整的 Java 审核接口和操作记录留在第 7 阶段。旧搜索接口仅返回已发布帖子。

## 后端验证

```bash
cd backend
mvn test
mvn verify
```

Flyway 在已有 Prisma 数据库上使用版本 `1` 建立迁移基线；业务表结构仍由 Prisma 暂时维护，后续 Java 业务迁移从 `V2` 开始编写数据库迁移。前端全部切换并完成验证前，不删除现有 Next.js API、NextAuth 或 Prisma 实现。
