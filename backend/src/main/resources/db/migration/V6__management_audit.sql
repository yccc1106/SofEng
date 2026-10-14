CREATE TABLE "ManagementAudit" (
    id text PRIMARY KEY,
    "actorId" text NOT NULL REFERENCES "User"(id),
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    action text NOT NULL,
    note text,
    "createdAt" timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);
CREATE INDEX "ManagementAudit_target_idx" ON "ManagementAudit" ("targetType", "targetId", "createdAt" DESC);
ALTER TABLE "ChatMessage" ADD COLUMN "moderationStatus" text NOT NULL DEFAULT 'VISIBLE';
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_moderationStatus_check" CHECK ("moderationStatus" IN ('VISIBLE', 'BLOCKED'));
ALTER TABLE "Feedback" ADD COLUMN "handledBy" text REFERENCES "User"(id);
ALTER TABLE "Feedback" ADD COLUMN "handledAt" timestamp;
ALTER TABLE "Feedback" ADD COLUMN "handleNote" text;
