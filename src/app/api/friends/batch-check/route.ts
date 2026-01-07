import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// BATCH CHECK Friend Relationship
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const { searchParams } = new URL(req.url);
        const userIdsParam = searchParams.get("userIds");

        if (!userIdsParam) {
            return errorResponse("Missing userIds", 400);
        }

        const userIds = userIdsParam.split(',').filter(Boolean);
        if (userIds.length === 0) {
            return errorResponse("Invalid userIds", 400);
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const result: Record<string, { isFriend: boolean; isSelf: boolean; hasPendingRequest: boolean; pendingRequestId?: string }> = {};

        // 获取所有好友关系
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userAId: user.id, userBId: { in: userIds } },
                    { userBId: user.id, userAId: { in: userIds } }
                ]
            }
        });

        // 获取所有待处理的好友请求
        const pendingRequests = await prisma.friendRequest.findMany({
            where: {
                OR: [
                    { senderId: user.id, receiverId: { in: userIds }, status: "PENDING" },
                    { senderId: { in: userIds }, receiverId: user.id, status: "PENDING" }
                ]
            }
        });

        // 构建结果
        for (const targetId of userIds) {
            const isSelf = user.id === targetId;

            const isFriend = friendships.some(f =>
                (f.userAId === user.id && f.userBId === targetId) ||
                (f.userAId === targetId && f.userBId === user.id)
            );

            const pendingRequest = pendingRequests.find(r =>
                (r.senderId === user.id && r.receiverId === targetId) ||
                (r.senderId === targetId && r.receiverId === user.id)
            );

            result[targetId] = {
                isFriend,
                isSelf,
                hasPendingRequest: !!pendingRequest,
                pendingRequestId: pendingRequest?.id
            };
        }

        return successResponse(result, "Relationship status retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}