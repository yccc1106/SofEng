-- Preserve case-insensitive email identity under concurrent registrations.
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_key"
    ON "User" (LOWER("email")) WHERE "email" IS NOT NULL;

ALTER TABLE "User" ADD CONSTRAINT "User_status_check"
    CHECK ("status" IN ('ACTIVE', 'FROZEN', 'BANNED', 'DELETED'));
