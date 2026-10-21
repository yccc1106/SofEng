-- 只创建两个 TRTC 测试用户和一条好友关系。
-- 不要和 demo-data.sql 一起执行；本脚本适用于已有业务数据的 meetu 库。
BEGIN;

INSERT INTO "User" (
  id, name, email, password, role, gender, school, major, grade, bio,
  "personalityType", "personalityTags", "verificationStatus",
  "createdAt", "updatedAt", status
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'TRTC 演示 A',
  'trtc.a@example.com',
  '$2a$10$gLqyzxVWB4vsiUteK9J9pOwDt3hbLLqECgv9Th9dNtz9FC9YRcYWy',
  'USER',
  'SECRET',
  '测试大学',
  '计算机科学与技术',
  '2023级',
  'TRTC 音视频通话演示账号 A',
  'INFP',
  ARRAY['友善', '测试']::text[],
  'UNVERIFIED',
  (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  'ACTIVE'
)
ON CONFLICT DO NOTHING;

INSERT INTO "User" (
  id, name, email, password, role, gender, school, major, grade, bio,
  "personalityType", "personalityTags", "verificationStatus",
  "createdAt", "updatedAt", status
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  'TRTC 演示 B',
  'trtc.b@example.com',
  '$2a$10$gLqyzxVWB4vsiUteK9J9pOwDt3hbLLqECgv9Th9dNtz9FC9YRcYWy',
  'USER',
  'SECRET',
  '测试大学',
  '软件工程',
  '2023级',
  'TRTC 音视频通话演示账号 B',
  'ENFP',
  ARRAY['友善', '测试']::text[],
  'UNVERIFIED',
  (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  'ACTIVE'
)
ON CONFLICT DO NOTHING;

UPDATE "User"
SET email = 'trtc.a@example.com', name = 'TRTC 演示 A'
WHERE id = '11111111-1111-4111-8111-111111111111';

UPDATE "User"
SET email = 'trtc.b@example.com', name = 'TRTC 演示 B'
WHERE id = '22222222-2222-4222-8222-222222222222';

INSERT INTO "Friendship" (
  id, "userAId", "userBId", status, "createdAt"
) VALUES (
  'trtc-test-friend-20261021',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'FRIEND',
  (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
)
ON CONFLICT DO NOTHING;

COMMIT;

SELECT id, email, status, role
FROM "User"
WHERE id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
)
ORDER BY id;

SELECT id, "userAId", "userBId", status
FROM "Friendship"
WHERE id = 'trtc-test-friend-20261021';
