-- Canonical pairs protect against reverse duplicates, including writes from legacy routes.
CREATE UNIQUE INDEX "Friendship_canonical_active_key" ON "Friendship"
    (LEAST("userAId", "userBId"), GREATEST("userAId", "userBId"))
    WHERE status = 'FRIEND';
CREATE UNIQUE INDEX "FriendRequest_canonical_pending_key" ON "FriendRequest"
    (LEAST("senderId", "receiverId"), GREATEST("senderId", "receiverId"))
    WHERE status = 'PENDING';

ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_distinct_users_check"
    CHECK ("userAId" <> "userBId");
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_distinct_users_check"
    CHECK ("senderId" <> "receiverId");
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_status_check"
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'));
ALTER TABLE "Team" ADD CONSTRAINT "Team_max_members_check"
    CHECK ("maxMembers" BETWEEN 2 AND 20);
ALTER TABLE "Team" ADD CONSTRAINT "Team_status_check"
    CHECK (status IN ('RECRUITING', 'FULL', 'DISBANDED'));
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_status_check"
    CHECK (status IN ('PENDING', 'JOINED', 'REJECTED'));
