# PRD - 社交网络平台

## 项目定义
一个类似于Reddit、Twitter、Facebook的社交网络平台，提供内容分享、即时组队、兴趣社交等功能。

---

## 一、用户角色

| 角色 | 描述 |
|------|------|
| 普通用户 | 使用平台所有社交功能 |
| 管理员 | 管理用户、审核举报内容 |

---

## 二、核心业务流程

### 2.1 用户关系流程

**添加好友流程：**
```
1. 用户A搜索用户B
2. 用户A发送好友请求（可附带验证消息）
3. 用户B在"好友请求"页面看到请求
4. 用户B选择：同意 / 拒绝 / 忽略
5. 同意后：双方成为好友，可以开始私聊
```

### 2.2 即时组队流程

**创建组队流程：**
```
1. 用户创建队伍（设定名称、类型、人数上限、是否审批）
2. 其他用户申请加入
3. 如果需要审批：队长审核后决定是否通过
4. 如果无需审批：直接加入
5. 队长可随时解散队伍
6. 成员可随时退出队伍
```

### 2.3 聊天业务流程

**聊天类型：**
| 类型 | 描述 | 发送条件 |
|------|------|----------|
| 私聊 | 1对1聊天 | 双方需为好友 |
| 队伍群聊 | 队伍内成员聊天 | 需为队伍成员 |
| 兴趣群聊 | 兴趣话题下的公共聊天 | 无需验证 |

---

## 三、功能模块

### 3.1 用户系统

| 功能 | 描述 |
|------|------|
| 用户注册 | 通过邮箱/手机号注册账号 |
| 用户登录 | 账号密码登录 |
| 完善个人信息 | 姓名、性别、学校、专业、年级、头像、简介 |
| MBTI性格测试 | 测试并展示人格类型 |
| AI雷达匹配 | 基于个人信息匹配志同道合的陌生人 |

### 3.2 好友关系

| 功能 | 描述 |
|------|------|
| 搜索用户 | 按用户名/ID搜索其他用户 |
| 发送好友请求 | 添加好友时附带验证消息 |
| 查看好友请求 | 收到的好友请求列表 |
| 处理好友请求 | 同意/拒绝/忽略 |
| 查看好友列表 | 已添加的好友列表 |
| 删除好友 | 解除好友关系 |
| 拉黑用户 | 阻止对方加好友或发消息 |

### 3.3 聊天系统

| 功能 | 描述 |
|------|------|
| 私聊 | 与好友进行1对1聊天 |
| 队伍群聊 | 队伍成员之间的群组聊天 |
| 兴趣大厅聊天 | 兴趣话题下的公共讨论 |
| 消息实时推送 | WebSocket实时接收消息 |
| 查看消息历史 | 查看之前的聊天记录 |
| 消息已读状态 | 显示消息是否已读 |
| 消息撤回/删除 | 撤回或删除已发送的消息 |

### 3.4 即时组队

| 功能 | 描述 |
|------|------|
| 创建队伍 | 创建即时组队，设定名称、描述、类型、人数 |
| 修改队伍信息 | 更新队伍名称、描述等 |
| 申请加入队伍 | 向队长发送入队申请 |
| 审批入队请求 | 队长审批用户入队请求 |
| 退出队伍 | 成员主动退出队伍 |
| 解散队伍 | 队长解散队伍 |
| 队伍聊天 | 队伍内成员实时聊天 |
| 队伍公告 | 队长发布队伍公告 |

### 3.5 内容发布

| 功能 | 描述 |
|------|------|
| 发布帖子 | 发布图文内容 |
| 帖子评论 | 对帖子进行评论（二级评论结构） |
| 点赞帖子 | 对帖子点赞/取消点赞 |
| 收藏帖子 | 收藏喜欢的帖子 |
| 删除帖子 | 删除自己发布的帖子 |

### 3.6 兴趣模块

| 功能 | 描述 |
|------|------|
| 选择兴趣 | 用户选择关注的话题模块 |
| 兴趣动态 | 查看关注话题的内容流 |
| 兴趣群聊 | 在话题下参与讨论 |

### 3.7 通知系统

| 功能 | 描述 |
|------|------|
| 好友请求通知 | 新好友请求提醒 |
| 入队请求通知 | 新入队请求提醒 |
| 点赞通知 | 帖子被点赞提醒 |
| 评论通知 | 帖子被评论提醒 |
| 消息通知 | 新私聊消息提醒 |

### 3.8 举报与反馈

| 功能 | 描述 |
|------|------|
| 提交反馈 | 用户提交使用反馈 |
| 举报帖子 | 举报违规帖子 |
| 举报评论 | 举报违规评论 |
| 举报用户 | 举报违规用户 |
| 举报消息 | 举报不当消息 |
| 举报处理 | 管理员审核举报内容 |

---

## 四、数据库模型

### 4.1 用户 (User)

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 用户唯一标识 |
| name | String | 用户名 |
| email | String | 邮箱（唯一） |
| phoneNumber | String | 手机号（唯一） |
| password | String | 加密密码 |
| image | String | 头像URL |
| role | Enum | 角色（USER/ADMIN） |
| gender | Enum | 性别 |
| studentId | String | 学号 |
| school | String | 学校 |
| major | String | 专业 |
| grade | Int | 年级 |
| bio | String | 个人简介 |
| realName | String | 真实姓名 |
| personalityType | String | MBTI类型 |
| personalityTags | String[] | 人格标签 |
| verificationStatus | Enum | 学信网认证状态 |

### 4.2 好友请求 (FriendRequest)

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 唯一标识 |
| senderId | UUID | 发起者ID |
| receiverId | UUID | 接收者ID |
| message | String | 验证消息 |
| status | Enum | 状态（PENDING/ACCEPTED/REJECTED） |
| createdAt | DateTime | 创建时间 |

### 4.3 好友关系 (Friendship)

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 唯一标识 |
| userAId | UUID | 用户A |
| userBId | UUID | 用户B |
| status | Enum | 状态（FRIEND/BLOCKED） |
| createdAt | DateTime | 创建时间 |

### 4.4 队伍 (Team)

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 唯一标识 |
| name | String | 队伍名称 |
| description | String | 队伍描述 |
| type | Enum | 类型（GAME/STUDY/SPORT/OTHER） |
| maxMembers | Int | 最大人数 |
| status | Enum | 状态（RECRUITING/FULL/DISBANDED） |
| requiresApproval | Boolean | 是否需要审批 |
| creatorId | UUID | 创建者ID |
| createdAt | DateTime | 创建时间 |

### 4.5 队伍成员 (TeamMember)

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 唯一标识 |
| teamId | UUID | 队伍ID |
| userId | UUID | 用户ID |
| role | Enum | 角色（LEADER/MEMBER） |
| status | Enum | 状态（PENDING/JOINED/REJECTED/LEFT） |
| joinMessage | String | 入队留言 |
| createdAt | DateTime | 加入时间 |

### 4.6 消息 (ChatMessage)

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 唯一标识 |
| content | String | 消息内容 |
| type | Enum | 类型（TEXT/IMAGE/AUDIO/SYSTEM） |
| senderId | UUID | 发送者ID |
| receiverId | UUID | 私聊接收者ID |
| teamId | UUID | 队伍ID |
| categoryId | UUID | 兴趣分类ID |
| isRead | Boolean | 是否已读 |
| createdAt | DateTime | 发送时间 |

---

## 五、API 设计

### 5.1 好友相关 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/friends/requests | 发送好友请求 |
| GET | /api/friends/requests | 获取好友请求列表 |
| PUT | /api/friends/requests/[id] | 处理好友请求 |
| DELETE | /api/friends/requests/[id] | 取消好友请求 |
| GET | /api/friends | 获取好友列表 |
| DELETE | /api/friends/[userId] | 删除好友 |
| POST | /api/friends/block/[userId] | 拉黑用户 |
| DELETE | /api/friends/block/[userId] | 取消拉黑 |

### 5.2 聊天相关 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/chat/contacts | 获取联系人列表 |
| GET | /api/chat/messages | 获取消息历史 |
| POST | /api/chat/messages | 发送消息 |
| PUT | /api/chat/messages/[id]/read | 标记消息已读 |
| DELETE | /api/chat/messages/[id] | 删除消息 |

### 5.3 队伍相关 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/teams | 获取队伍列表 |
| POST | /api/teams | 创建队伍 |
| GET | /api/teams/[id] | 获取队伍详情 |
| PUT | /api/teams/[id] | 更新队伍信息 |
| DELETE | /api/teams/[id] | 解散队伍 |
| POST | /api/teams/[id]/join | 申请加入队伍 |
| GET | /api/teams/[id]/requests | 获取入队请求 |
| PUT | /api/teams/[id]/requests/[userId] | 处理入队请求 |
| POST | /api/teams/[id]/leave | 退出队伍 |
| POST | /api/teams/[id]/kick/[userId] | 踢出成员 |

---

## 六、用户操作流程

### 6.1 社交流程

```
注册/登录
  ↓
完善个人信息（推荐）
  ↓
选择感兴趣的模块
  ↓
浏览内容（帖子、动态）
  ↓
发现感兴趣的用户（不一定是这样发现的，总之：只要点到了用户的主页，我们就可以添加为好友） → 发送好友请求
                          ↓
                    等待对方同意
                          ↓
                    成为好友 → 开始私聊
                                  ↓
                            加入队伍 → 参与活动
```

### 6.2 即时组队流程

```
创建队伍（设定规则）
      ↓
发布组队信息
      ↓
其他用户申请加入
      ↓
审批/自动通过
      ↓
开始活动
      ↓
解散/退出队伍
```

---

## 七、技术架构

### 前端
- Next.js
- React
- TypeScript
- Tailwind CSS

### 后端
- Next.js API
- Prisma ORM
- PostgreSQL

### 实时通信
- WebSocket
- Redis Pub/Sub