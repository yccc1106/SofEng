# 重构计划 - 社交网络平台

## 状态：✅ 已完成

### Phase 1: 核心功能修复

#### P1.1 好友关系验证（后端）
- [x] `POST /api/chat` 添加私聊好友关系验证
- [x] 返回友好错误提示："需要先添加好友才能发送消息"

#### P1.2 搜索页面添加好友请求按钮
- [x] 修改 `src/app/user/search/page.tsx`
- [x] 添加"加好友"按钮（对方不是好友时显示）
- [x] 添加"发消息"按钮（对方是好友时显示）
- [x] 添加好友请求弹窗（可输入验证消息）

#### P1.3 删除好友功能
- [x] 新增 `DELETE /api/friends/[userId]` API
- [x] 前端好友列表添加删除按钮

### Phase 2: 消息功能完善

#### P2.1 消息已读状态
- [x] 新增 `PUT /api/chat/read` API
- [x] 聊天页面打开时标记消息已读

#### P2.2 消息撤回/删除
- [x] 新增 `DELETE /api/chat/messages/[id]` API
- [x] 前端添加撤回按钮（发送后2分钟内）

#### P2.3 兴趣群聊 WebSocket
- [x] 修复 `src/app/user/chat/page.tsx` 的 roomType 判断
- [x] 添加兴趣圈聊天的 WebSocket 支持

### Phase 3: 前端体验优化

#### T3.1 导航结构重构
- [x] 新增底部导航栏（移动端）/ 顶部导航（桌面端）
- [x] 通知徽章显示未读数

#### T3.2 用户资料页面
- [x] 新增 `/user/profile/[id]` 页面
- [x] 显示：头像、名字、MBTI、学校、专业、简介
- [x] 如果是好友：显示"发消息"按钮
- [x] 如果不是好友：显示"加好友"按钮

#### T3.3 好友请求管理页面优化
- [x] 优化 `/user/friends` 页面
- [x] Tab 切换：好友列表 | 收到请求 | 发出请求

### Phase 4: 通知系统

#### T4.1 通知 API
- [x] 新增 `/api/notifications` API
- [x] 新增 `/api/notifications/count` API

#### T4.2 通知中心页面
- [x] 新增 `/user/notifications` 页面
- [x] 分类显示通知

### Phase 5: 队伍功能

#### T5.1 队伍功能检查
- [x] 队伍 API 完整（创建、加入、审批）
- [x] 队伍聊天功能正常

---

## 新增文件清单

### API
| 文件 | 功能 |
|------|------|
| `src/app/api/friends/check/route.ts` | 检查好友关系 |
| `src/app/api/friends/batch-check/route.ts` | 批量检查好友关系 |
| `src/app/api/friends/[userId]/route.ts` | 删除好友 |
| `src/app/api/users/[id]/route.ts` | 获取用户信息 |
| `src/app/api/chat/read/route.ts` | 标记消息已读 |
| `src/app/api/chat/messages/[id]/route.ts` | 删除/撤回消息 |
| `src/app/api/notifications/route.ts` | 获取通知列表 |
| `src/app/api/notifications/count/route.ts` | 获取通知数量 |

### 页面
| 文件 | 功能 |
|------|------|
| `src/app/user/profile/[id]/page.tsx` | 用户资料页 |
| `src/app/user/notifications/page.tsx` | 通知中心 |

### 组件
| 文件 | 功能 |
|------|------|
| `src/components/Layout/BottomNavBar.tsx` | 底部导航栏 |

---

## 修复的问题

1. ✅ 私聊必须先成为好友
2. ✅ 搜索用户可以发送好友请求
3. ✅ 队伍成员才能在队伍群聊中发言
4. ✅ 消息已读状态
5. ✅ 消息撤回（2分钟内）
6. ✅ 兴趣群聊 WebSocket 支持
7. ✅ 底部导航栏
8. ✅ 用户资料页面
9. ✅ 通知中心
10. ✅ 删除好友功能