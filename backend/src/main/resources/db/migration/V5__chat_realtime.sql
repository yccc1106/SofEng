-- A message belongs to exactly one conversation. Legacy invalid rows must be repaired before this migration.
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_single_target_check"
    CHECK (num_nonnulls("receiverId", "teamId", "categoryId") = 1);
CREATE INDEX "ChatMessage_direct_history_idx" ON "ChatMessage" ("senderId", "receiverId", "createdAt" DESC, id DESC)
    WHERE "receiverId" IS NOT NULL;
CREATE INDEX "ChatMessage_team_history_idx" ON "ChatMessage" ("teamId", "createdAt" DESC, id DESC)
    WHERE "teamId" IS NOT NULL;
CREATE INDEX "ChatMessage_category_history_idx" ON "ChatMessage" ("categoryId", "createdAt" DESC, id DESC)
    WHERE "categoryId" IS NOT NULL;
CREATE TABLE "ChatReadCursor" (
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "scopeType" VARCHAR(10) NOT NULL CHECK ("scopeType" IN ('USER', 'TEAM', 'CATEGORY')),
    "scopeId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("userId", "scopeType", "scopeId")
);
