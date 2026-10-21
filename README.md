# MeetU

MeetU 使用 React / Next.js 前端与 Spring Boot 单体后端。业务接口、登录会话、权限及数据访问由 Java 提供；后端按 Controller → Service 接口 → ServiceImpl → MyBatis Mapper 分层，使用 PostgreSQL 和 Flyway。

## 完整启动指南

### 1. 环境要求

| 组件 | 要求 |
|---|---|
| Node.js | 20.9 或更高版本，推荐 Node.js 22/24 |
| pnpm | `10.33.4`（项目已写入 `packageManager`） |
| Java | JDK 17 |
| Maven | 3.9 或更高版本；也可以使用 IntelliJ IDEA 自带的 Maven |
| Docker | Docker Desktop，用于运行 PostgreSQL 15 |
| 浏览器 | Chrome、Edge、Firefox 或 Safari 的当前版本 |

如果 `pnpm` 版本不一致，可以使用 Corepack：

```powershell
corepack enable
corepack prepare pnpm@10.33.4 --activate
pnpm --version
```

如果命令行找不到 `mvn`，可以用 IntelliJ IDEA 打开 `backend/pom.xml`，在 Maven 工具窗口运行 Spring Boot，或者安装 Maven 3.9+ 并加入 `PATH`。

### 2. 启动 PostgreSQL

在项目根目录执行：

```powershell
docker compose up -d
docker compose ps
```

数据库配置固定为：

```text
数据库：meetu
用户：postgres
密码：password
宿主机端口：5433
容器内端口：5432
```

停止数据库但保留数据：

```powershell
docker compose down
```

只有在确定要清空数据库时才使用 `docker compose down -v`。

### 3. 配置 Java 后端环境变量

Spring Boot 不会自动读取项目根目录的 `.env`。请在实际启动后端的终端中设置环境变量。Windows PowerShell 示例：

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5433/meetu"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "password"
$env:SERVER_PORT = "8080"
$env:FRONTEND_ORIGIN = "http://localhost:3000"
$env:SESSION_COOKIE_SECURE = "false"

# 音视频通话（服务端专用，不能加 NEXT_PUBLIC_ 前缀）
$env:TRTC_SDK_APP_ID = "你的 SDKAppID"
$env:TRTC_SECRET_KEY = "你的 SecretKey"
$env:TRTC_USER_SIG_EXPIRE_SECONDS = "86400"

# AI 雷达需求理解（没有 Key 时自动回退本地规则）
$env:DEEPSEEK_API_KEY = "你的 DeepSeek API Key"
$env:DEEPSEEK_BASE_URL = "https://api.deepseek.com"
$env:DEEPSEEK_MODEL = "deepseek-chat"

# 聊天图片保存目录
$env:UPLOAD_DIR = "./uploads"
```

Bash / macOS / Linux 示例：

```bash
export DB_URL="jdbc:postgresql://localhost:5433/meetu"
export DB_USERNAME="postgres"
export DB_PASSWORD="password"
export SERVER_PORT="8080"
export FRONTEND_ORIGIN="http://localhost:3000"
export TRTC_SDK_APP_ID="你的 SDKAppID"
export TRTC_SECRET_KEY="你的 SecretKey"
export TRTC_USER_SIG_EXPIRE_SECONDS="86400"
export DEEPSEEK_API_KEY="你的 DeepSeek API Key"
export DEEPSEEK_BASE_URL="https://api.deepseek.com"
export DEEPSEEK_MODEL="deepseek-chat"
export UPLOAD_DIR="./uploads"
```

`example.env` 是配置模板，包含前端和后端变量；不要把它当成 Spring Boot 会自动加载的配置文件。

如果通过 IntelliJ IDEA 运行 `MeetUBackendApplication`，请把同样的键值对填到 **Run/Debug Configurations → Environment variables**（或使用 EnvFile 插件），否则 TRTC 和 DeepSeek 配置不会进入 Java 进程。

### 4. 启动 Java 后端

```powershell
cd backend
mvn spring-boot:run
```

首次启动时，Flyway 会自动执行 `V1`–`V6`：

```text
backend/src/main/resources/db/migration/
├── V1__initialize_migration_baseline.sql
├── V2__user_identity_constraints.sql
├── V3__post_status_constraint.sql
├── V4__friend_team_invariants.sql
├── V5__chat_realtime.sql
└── V6__management_audit.sql
```

如果数据库不是空库，启动前先备份，并查看启动日志中的 Flyway 和 `flyway_schema_history` 结果。已存在旧 Prisma 业务表的数据库会使用 Flyway baseline，继续执行后续迁移；不要在已有业务表上手工执行 V1。

后端启动后可访问：

- 服务检查：<http://localhost:8080/api/system/ping>
- 健康检查：<http://localhost:8080/actuator/health>
- OpenAPI：<http://localhost:8080/v3/api-docs>
- Swagger UI：<http://localhost:8080/swagger-ui.html>

### 5. 配置并启动前端

在项目根目录创建 `.env.local`：

```env
JAVA_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_JAVA_WS_URL=ws://localhost:8080/api/chat/ws
```

安装依赖并启动：

```powershell
pnpm install
pnpm dev
```

浏览器打开 <http://localhost:3000>。

前端所有业务请求通过 `/java/*` 代理到 Java 的 `/api/*`。如果 Java 不在默认端口，必须同时修改：

```env
JAVA_BACKEND_URL=http://localhost:18080
NEXT_PUBLIC_JAVA_WS_URL=ws://localhost:18080/api/chat/ws
```

然后重启 `pnpm dev`。`NEXT_PUBLIC_JAVA_WS_URL` 必须在启动/构建时提供；HTTPS 部署时改为 `wss://`。

生产构建：

```powershell
pnpm build
pnpm start
```

### 6. 创建管理员和演示数据

空数据库首次启动没有管理员。先在页面注册一个账号，再由可信数据库管理员执行：

```sql
UPDATE "User" SET role = 'ADMIN'
WHERE email = 'your-admin@example.test' AND status = 'ACTIVE'
RETURNING id, email, role;
```

如果要使用演示数据，先确认 Java 后端已完成 Flyway V1–V6，再在项目根目录执行：

```powershell
docker cp .\scripts\demo-data.sql meetu_postgres:/tmp/meetu-demo-data.sql
docker exec meetu_postgres psql -U postgres -d meetu -v ON_ERROR_STOP=1 -f /tmp/meetu-demo-data.sql
```

演示脚本只适用于独立空库或仅含演示数据的库，包含 40 个普通用户、1 个管理员、内容、好友、队伍、聊天、反馈和认证申请。演示账号：

```text
管理员：admin.demo@example.test / MeetUdemo2026!
普通用户：demo01@example.test 至 demo40@example.test / MeetUdemo2026!
```

不要在生产库运行演示脚本或沿用演示密码。

### 7. TRTC 音视频通话

当前前端使用 `@trtc/calls-uikit-react`，UserSig 由 Java 后端生成：

```text
浏览器 → /java/trtc/usersig → Java /api/trtc/usersig
                                  ↓
                          TRTC SDKAppID + SecretKey
```

必须同时配置后端的：

```env
TRTC_SDK_APP_ID=你的 SDKAppID
TRTC_SECRET_KEY=你的 SecretKey
TRTC_USER_SIG_EXPIRE_SECONDS=86400
```

`TRTC_SECRET_KEY` 只能放在服务端，不能写入 `NEXT_PUBLIC_*`。配置后重启 Java 后端。

使用方式：

1. 打开好友页，在每个好友头像下方的“操作”下拉中选择“语音/视频通话”；
2. 或进入好友聊天，点击右上角电话图标；
3. 在弹窗中选择“语音通话”或“视频通话”；
4. 首次呼叫允许浏览器访问麦克风和摄像头；
5. 被叫端必须在另一个浏览器配置文件、无痕窗口或另一台设备上登录，并保持在登录后的页面（推荐停留在 `/user/*` 页面）；
6. 来电通常约 30 秒内需要接听，超时会显示无人接听。

不要用同一个普通浏览器窗口的两个标签页登录两个账号，它们共享 `JSESSIONID` Cookie，后登录会覆盖先登录。通话页面必须使用 `localhost` 或 HTTPS。

#### 已有业务库只插入测试账号

如果当前 `meetu` 库已经有原来的用户、分类和帖子，**不要再次执行 `demo-data.sql`**。该脚本只允许空库或纯演示库。

只创建两个 TRTC 测试用户和一条好友关系，使用独立脚本：

```powershell
docker cp .\scripts\trtc-test-accounts.sql meetu_postgres:/tmp/trtc-test-accounts.sql
docker exec meetu_postgres psql -U postgres -d meetu -v ON_ERROR_STOP=1 -f /tmp/trtc-test-accounts.sql
```

脚本执行后会输出两个用户和一条好友关系，预期各为 2 行和 1 行。测试账号统一密码为 `MeetUdemo2026!`。

演示账号（直接按表格填写登录）：

| 角色 | 邮箱 | 密码 | 用户 ID |
|---|---|---|---|
| A | `trtc.a@example.com` | `MeetUdemo2026!` | `11111111-1111-4111-8111-111111111111` |
| B | `trtc.b@example.com` | `MeetUdemo2026!` | `22222222-2222-4222-8222-222222222222` |

直接会话地址：

| 角色 | 打开的地址 |
|---|---|
| A → B | `http://localhost:3000/user/chat?targetId=22222222-2222-4222-8222-222222222222` |
| B → A | `http://localhost:3000/user/chat?targetId=11111111-1111-4111-8111-111111111111` |

脚本可以重复执行：已存在的固定用户 ID 会被更新为新邮箱和演示名称，好友关系不会重复创建。

如果你刚才在 DataGrip/IDEA 数据库控制台执行过 `demo-data.sql` 并看到 `P0001`，先在原控制台执行 `ROLLBACK;`，或者直接使用上面的新 `psql` 连接执行独立脚本；不要在已经报错的旧事务里继续粘贴 SQL。

#### TRTC 演示好友对

先按第 6 节导入 `scripts/demo-data.sql`。以下两组账号已经在脚本中建立好友关系，可以直接测试私聊和通话：

| 组合 | 账号 A | 账号 B | 固定用户 ID |
|---|---|---|---|
| 1 | `demo01@example.test` / `MeetUdemo2026!`（林小雨） | `demo21@example.test` / `MeetUdemo2026!`（邓静宜） | `demo-u01` ↔ `demo-u21` |
| 2 | `demo02@example.test` / `MeetUdemo2026!`（陈子航） | `demo22@example.test` / `MeetUdemo2026!`（韩逸飞） | `demo-u02` ↔ `demo-u22` |

组合 1 的两个固定会话地址：

```text
账号 A：http://localhost:3000/user/chat?targetId=demo-u21
账号 B：http://localhost:3000/user/chat?targetId=demo-u01
```

组合 2 的两个固定会话地址：

```text
账号 A：http://localhost:3000/user/chat?targetId=demo-u22
账号 B：http://localhost:3000/user/chat?targetId=demo-u02
```

#### 双账号通话测试流程

1. 确认 PostgreSQL、Java 后端和前端都已启动，且 Java 后端已配置 **有效** 的 `TRTC_SDK_APP_ID`、`TRTC_SECRET_KEY`。
2. 用普通浏览器窗口登录账号 A，打开对应的 `/user/chat?targetId=...` 地址。
3. 用 InPrivate/无痕窗口或另一个浏览器配置文件登录账号 B，打开自己的会话地址。不要使用两个普通标签页。
4. 两边都先确认聊天页可以正常加载；打开一次电话弹窗，确认没有显示“通话服务未就绪”，且“语音通话/视频通话”按钮可用。
5. 账号 A 点击聊天头部电话图标，或在好友页头像下方的“操作”菜单中选择“语音/视频通话”。
6. 在弹窗中选择语音或视频；首次呼叫允许麦克风和摄像头权限。
7. 账号 B 应出现来电界面。保持被叫页面在前台，并在约 30 秒内点击接听。
8. 接通后验证双向音频、静音、挂断；视频通话再验证摄像头画面和挂断。
9. 如果主叫侧收到 `onUserNoResponse`，优先检查账号 B 是否真的登录到了不同的浏览器配置文件、是否停留在已登录页面，以及它的 TRTC 是否初始化成功。

该脚本只能导入独立的空演示库或仅含演示数据的库；不要在生产库使用演示密码。

### 8. AI 雷达

雷达页面支持输入一句话需求，例如：

```text
想找周末打球、性格开朗的同学
```

前端请求：

```text
/java/radar?q=<需求>
```

Java 后端依次执行：

1. DeepSeek 需求理解；
2. 候选用户筛选；
3. 本地规则评分；
4. 推荐理由生成。

DeepSeek 只负责把需求转换为筛选条件，不读取候选人完整资料，也不直接决定排名。未配置 `DEEPSEEK_API_KEY`、模型超时或返回格式不合法时，会继续使用本地规则，页面显示“本地匹配”。

#### 本地图片上传

聊天、帖子和兴趣小组均支持从本机选择图片：

- 支持 JPEG、PNG、WEBP、GIF；
- 单张图片最大 5MB；
- 聊天图片保存到 `uploads/chat/`，帖子最多 10 张图片并保存到 `uploads/post/`，兴趣小组封面保存到 `uploads/team/`；
- 根目录可通过 `UPLOAD_DIR` 修改，数据库保存 `/java/uploads/<scope>/<文件名>` 访问路径，不保存二进制图片；
- 图片消息仍通过 Java REST 落库，并由 Java WebSocket 实时推送。

管理员审核页会回显帖子正文、分类、作者和多张配图，以及兴趣小组封面和简介；管理员只能执行帖子通过/拒绝或解散小组等审核操作，不能编辑用户资料或用户发布的内容。

本地存储适合课程演示和单机运行。正式部署时应替换为对象存储，并增加访问控制、图片压缩和清理策略。

### 9. 验证命令

后端：

```powershell
cd backend
mvn test
mvn verify
```

前端：

```powershell
pnpm exec tsc --noEmit
pnpm exec eslint src
pnpm build
```

### 10. 常见问题

**`mvn` 找不到**

使用 IntelliJ IDEA 的 Maven 工具窗口，或安装 Maven 3.9+ 并加入 `PATH`。IDEA 自带的 Maven 通常位于 IDEA 安装目录的 `plugins/maven/lib/maven3/bin`。

**`pnpm` 版本不一致**

执行 `corepack enable` 和 `corepack prepare pnpm@10.33.4 --activate`。如果本机没有 Corepack，可以安装 `pnpm@10.33.4`。

**数据库连接失败**

确认 `docker compose ps` 中 PostgreSQL 正在运行，端口是 `5433`，并使用 Java 后端的 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD`。默认账号是 `postgres`，不是 MySQL 的 `root`。

**`/java/trtc/usersig` 返回 503**

Java 后端没有收到 `TRTC_SDK_APP_ID` 或 `TRTC_SECRET_KEY`。在两个环境变量都设置后重启后端；不要只在浏览器 `.env.local` 中设置。

**来电端没有反应**

先用被叫端浏览器控制台确认是否出现 `onCallReceived`。如果已经出现，说明 TRTC 信令已经到达，问题在通话 UI 或页面状态，而不是 UserSig。

- 如果日志出现 `[kickedOut] type:multipleAccount`，说明同一个 TRTC 用户 ID 同时在多个 Web 实例登录；后登录的实例会把前一个踢下线，`TUICallKit` 随即退出，因此没有来电 UI。关闭该账号的所有其他标签页/窗口，只保留一个。
- 确认两个账号使用不同的浏览器配置文件；普通标签页共享 `JSESSIONID` Cookie。
- 关闭两边已经存在的通话窗口，刷新页面后只发起一次呼叫，不要连续点击。
- 检查 `TUICallKit` 是否被最小化为悬浮窗，尝试恢复通话窗口。
- 如果控制台出现 `updateLocalAudio abort: not started`，通常是上一次通话仍处于结束/初始化状态；先挂断或刷新，再发起新通话。
- 被叫端保持页面在前台，并在约 30 秒内点击接听。

**聊天一直显示连接中**

确认 Java 后端已启动，`NEXT_PUBLIC_JAVA_WS_URL` 指向可访问的 `ws://`/`wss://` 地址，并确认浏览器携带与 Java REST 相同的 `JSESSIONID`。跨主机部署时，反向代理必须转发 WebSocket Upgrade。

**`current transaction is aborted` / `25P02`**

这说明同一个 SQL 控制台里上一条语句已经失败，后续语句都被 PostgreSQL 忽略。先在原控制台执行：

```sql
ROLLBACK;
```

或者直接关闭并重新连接 SQL 控制台，然后只执行 `scripts/trtc-test-accounts.sql`。不要把 `demo-data.sql` 和测试账号脚本混在同一个失败事务里执行。

**DeepSeek 没有生效**

检查 Java 进程是否真的拿到了 `DEEPSEEK_API_KEY`。未配置时系统会正常回退本地规则，页面会显示“本地匹配”，不会中断雷达。

**Flyway 迁移失败**

不要删除 `flyway_schema_history` 或手工跳过版本。先备份数据库，检查失败版本、数据库连接和已有表结构；生产环境使用 `flyway migrate`/后端启动日志确认迁移结果。

## 快速命令索引

1. **启动数据库**

   在 **5433** 端口启动 PostgreSQL（推荐使用 Docker）：

   ```bash
   docker compose up -d

   # 用完记得关
   # docker compose down
   ```

2. **启动 Java 后端**

   本机需要 Java 17 与 Maven 3.9+：

   ```bash
   cd backend
   mvn spring-boot:run
   ```

   默认连接 `localhost:5433/meetu`。Flyway 在空数据库自动执行 V1–V6 建表和升级；已有数据库先备份，并在启动日志中确认迁移成功。可通过 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 和 `SERVER_PORT` 覆盖配置。开发环境默认允许 `http://localhost:3000` 发起写请求；部署到其他前端地址时设置 `FRONTEND_ORIGIN`，使用 HTTPS 时设置 `SESSION_COOKIE_SECURE=true`。

   启动后可访问：

   - 服务检查：<http://localhost:8080/api/system/ping>
   - 数据库健康检查：<http://localhost:8080/actuator/health>
   - OpenAPI：<http://localhost:8080/v3/api-docs>
   - Swagger UI：<http://localhost:8080/swagger-ui.html>

3. **启动前端开发服务器**

   ```bash
   pnpm dev

   # Java 服务地址不同于默认的 localhost:8080 时：
   # JAVA_BACKEND_URL=http://localhost:18080 pnpm dev

   # 如 Java WebSocket 端口也改为 18080，同时设置浏览器使用的地址：
   # JAVA_BACKEND_URL=http://localhost:18080 NEXT_PUBLIC_JAVA_WS_URL=ws://localhost:18080/api/chat/ws pnpm dev

   # 或

   pnpm build && pnpm start
   ```

前端默认访问 <http://localhost:3000>。所有业务请求通过 `/java/*` 代理到 Spring Boot 的 `/api/*`；前端与 Java 后端必须同时运行。页面会话取自 Java 个人资料接口，退出登录后服务端会话失效。账号被冻结、封禁或删除、角色变化时，Java 在每次请求重新核对数据库。首次启动的空库没有管理员账号；先通过页面注册，再由可信数据库管理员执行以下语句，并核对返回的邮箱和角色：

```sql
UPDATE "User" SET role = 'ADMIN'
WHERE email = 'your-admin@example.com' AND status = 'ACTIVE'
RETURNING id, email, role;
```

## 中英文界面与演示数据

前端默认显示简体中文。用户页面右上角和管理后台顶部可切换“中文 / English”；选择保存在当前浏览器的 `localStorage` 中，刷新页面后继续生效。当前已覆盖用户端主要页面、后台统计和管理页面。业务数据由数据库提供，不会因切换语言被翻译或修改。

仓库中的 [演示数据脚本](scripts/demo-data.sql) 可在 **Windows PowerShell** 上直接使用。它包含 40 个普通用户、1 个管理员、8 个兴趣分类、120 篇帖子、80 条评论、120 个点赞、12 支队伍、48 条队伍成员记录、20 对好友、8 条好友申请、136 条聊天消息、12 条反馈和 8 条认证申请；时间按导入时刻生成，用于展示当日和历史统计。全部账号和内容均为虚构数据。

请为演示使用**独立的空数据库**。完成上面的 Docker 数据库启动和 Java 后端启动步骤，确认 Flyway 已执行到 V6 后，在项目根目录运行：

```powershell
docker cp .\scripts\demo-data.sql meetu_postgres:/tmp/meetu-demo-data.sql
docker exec meetu_postgres psql -U postgres -d meetu -v ON_ERROR_STOP=1 -f /tmp/meetu-demo-data.sql
```

演示账号：管理员 `admin.demo@example.test`、普通用户 `demo01@example.test` 至 `demo40@example.test`，统一密码 `MeetUdemo2026!`。导入前脚本会检查用户表和分类表：如果存在非演示数据，会直接停止，不会混入真实数据。重复导入不会创建重复记录；如需让相对日期重新贴近演示当天，请重新创建独立的空演示库后导入。**不要在生产库运行该脚本或沿用演示密码。**

Windows 演示机器需要 Docker Desktop、Java 17、Maven 3.9+、Node.js 和 pnpm；在两处终端分别运行 `cd backend; mvn spring-boot:run` 与 `pnpm dev`，然后打开 <http://localhost:3000>。演示时可以展示社区动态、组队和聊天，并用管理员账号查看统计及审核页面。脚本是 UTF-8 文本，已随 Git 提交；将仓库复制到 Windows 后即可导入，不依赖本机的 PostgreSQL 数据文件。

聊天页面通过 `/java/chat*` 调用 Java REST，浏览器默认连接 `ws://localhost:8080/api/chat/ws`。部署时设置 `NEXT_PUBLIC_JAVA_WS_URL` 为可从浏览器访问的 WebSocket 地址；HTTPS 页面使用 `wss://`。WebSocket 需要收到与 Java REST 登录相同的 `JSESSIONID` Cookie，前后端跨主机部署时应通过同一站点的反向代理转发 WebSocket Upgrade，并将 `FRONTEND_ORIGIN` 设置为实际前端来源。WebSocket 只在当前 Java 单体实例内推送；当前部署方案为单实例。

## 第三阶段接口

- `POST /api/users`：邮箱、昵称和密码注册，密码至少 8 位；返回不含密码的用户资料。
- `POST /api/auth/login`、`POST /api/auth/logout`：建立或注销 Java 服务端会话。
- `GET /api/users/profile`、`PUT /api/users/profile`：仅操作当前登录用户；可编辑字段为昵称、学校、专业、年级和简介。
- Java 会话使用 `HttpOnly`、`SameSite=Lax` Cookie。写请求校验浏览器 `Origin`；生产环境必须使用 HTTPS 并启用安全 Cookie。单体后端重启后内存会话失效，用户需重新登录。

登录和注册按连接来源地址分别限制为每 5 分钟 10 次、每小时 5 次；超过限制返回 429 和 `Retry-After`。写请求必须携带匹配 `FRONTEND_ORIGIN` 的 `Origin`，或由同源浏览器提供 `Sec-Fetch-Site: same-origin`。生产环境将 Java 后端部署在可信网络内，前端通过 HTTPS 反向代理访问 `/java/*`；前端和 WebSocket 应使用同站点地址，并启用安全 Cookie。若 Java 只接受可信前端代理的连接，可把 `TRUSTED_PROXY_ADDRESS` 设为 Java 看到的前端代理地址，此时限流使用其 `X-Forwarded-For` 中的首个客户端 IP。入口代理必须覆盖客户端传入的同名头，且 Java 端口不得直接暴露给不可信网络；否则保持该变量为空并在入口代理另行配置按客户端 IP 的限流。

## 第四阶段接口

- `GET /api/category`、`GET /api/category/{id}`：公开分类查询，统一响应包装。
- `GET /api/posts`：公开浏览已发布帖子；登录作者也能看到自己的待审或被拒帖子。支持 `categoryId`、`page`、`pageSize`，兼容旧 `limit`，每页最多 100 条，返回 `pagination`。
- `POST /api/posts`：登录用户发布帖子，可携带最多 10 个 `/java/uploads/post/` 图片地址；新帖状态为 `AUDITING`，审核通过后才对其他用户可见。
- `POST /api/uploads/post-image`、`POST /api/uploads/team-image`：登录用户上传帖子配图或兴趣小组封面；GET 图片路径需要登录会话。
- `GET/POST /api/posts/{id}/comments`：已发布帖子的评论查询与发表。
- `POST /api/posts/{id}/like`、`POST /api/posts/{id}/collect`：已发布帖子点赞、收藏，再次调用取消。

前端分类、帖子和互动页面已切换到 `/java/*`；原 Next.js 分类与帖子接口已移除。帖子审核和操作记录已在第 7 阶段迁至 Java。

## 第六阶段聊天接口

- `GET /api/chat/contacts`：返回好友与已加入队伍联系人及未读数。
- `GET /api/chat?userId=...|teamId=...|categoryId=...`：返回最近 100 条消息，按时间升序展示；传 `before=<最早消息ID>` 获取更早一页。
- `POST /api/chat`：发送文本消息。私聊使用 `receiverId`，队聊使用 `teamId`，兴趣房间使用 `categoryId`，三个目标只能填写一个。
- `POST /api/chat/read`：标记当前会话已读；私聊消息另保存 `isRead` 状态。
- `/api/chat/ws`：Java WebSocket。客户端发送 `{"event":"join", "userId"|"teamId"|"categoryId":"..."}` 订阅会话，可发送 `leave` 退订、`ping` 保活；服务端发送 `joined`、`new:message`、`read`、`pong` 或 `error`。历史读取、消息发送及订阅均校验好友或队伍成员权限；兴趣房间要求登录。

页面断线后先按指数退避快速重连 5 次，之后每 30 秒继续尝试；重新连接时补取期间消息。服务端明确拒绝订阅时停止重连并显示错误。数据库时间以 UTC 存储，接口和页面以 `Asia/Shanghai` 展示。现有 WebSocket 推送限定在单个 Java 应用实例内。

## 第七阶段管理接口

- `POST/GET /api/feedback`：登录用户提交建议或带目标的举报，并且只能读取自己的反馈历史。
- `/api/admin/feedback`：管理员查询和处理反馈；处理人、时间、备注及措施写入数据库和管理审计记录。
- `/api/admin/moderation/posts`、`/chats`、`/rooms`：管理员只读查看帖子配图、队伍封面和内容后，审核帖子、逻辑屏蔽聊天消息或关闭队伍；普通用户的聊天历史不再返回被屏蔽消息。
- `/api/admin/users`、`/users/{id}`、`/verification`、`/interest`：管理员管理账号、审批认证和维护分类。管理员自身及其他管理员不可通过用户状态接口冻结或删除；有关联内容的分类不可删除。

上述页面已切换到 `/java/*`，对应旧 Next.js 管理 API Routes 已移除。第 8 阶段的统计接口由 Java 提供，并要求管理员角色。管理操作与审计记录在同一数据库事务内写入。举报中的“记录警告”只留审核记录，不向被举报用户发送通知；当前反馈表单不上传图片。

数据库无时区时间字段继续保存 UTC 值；Java JSON 响应使用带 `+08:00` 的上海时间，前端按 `Asia/Shanghai` 格式化。历史上由早期 Java 写入、未统一为 UTC 的记录可能显示偏差，需在可确认来源后单独校正，不能按日期批量改写。

## 后端验证

```bash
cd backend
mvn test
mvn verify
```

Flyway V1 为新数据库建立业务表；V2–V6 补充约束、聊天和审核结构。旧 Prisma 数据库的 Flyway 版本 1 为 `BASELINE`，继续执行后续版本；不要在已存在业务表的库上手工运行 V1。启动前应备份已有数据库，并以 `flyway_schema_history` 和健康检查核对结果。数据库无时区时间字段存储 UTC，接口与页面使用 `Asia/Shanghai`，响应时间带 `+08:00`。

部署时先设置生产数据库凭证、`FRONTEND_ORIGIN`、`JAVA_BACKEND_URL`、`NEXT_PUBLIC_JAVA_WS_URL` 和 `SESSION_COOKIE_SECURE=true`。`JAVA_BACKEND_URL` 与 `NEXT_PUBLIC_JAVA_WS_URL` 必须在前端构建时提供；后者需为浏览器可访问的 `wss://` 地址。前端路由代理会向 Java 查询当前会话，故应用间网络必须互通。验证 `/api/system/ping`、`/actuator/health`、匿名访问受保护页面的重定向、普通用户登录与管理员页面拒绝、管理员登录与管理接口后，再开放流量。当前会话保存在单实例内存中，应用重启会使用户重新登录；WebSocket 推送也仅在该实例内完成。
