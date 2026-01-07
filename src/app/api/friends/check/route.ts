import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// CHECK Friend Relationship
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get("userId");

        if (!targetUserId) {
            return errorResponse("Missing userId", 400);
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const isSelf = user.id === targetUserId;

        // 检查是否是好友
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userAId: user.id, userBId: targetUserId },
                    { userAId: targetUserId, userBId: user.id }
                ]
            }
        });

        const isFriend = !!friendship;

        // 检查是否有待处理的好友请求
        const pendingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: user.id, receiverId: targetUserId, status: "PENDING" },
                    { senderId: targetUserId, receiverId: user.id, status: "PENDING" }
                ]
            }
        });

        let requestStatus = undefined;
        let hasPendingRequest = false;
        let pendingRequestId = undefined;

        if (pendingRequest) {
            hasPendingRequest = true;
            requestStatus = pendingRequest.status as 'PENDING' | 'ACCEPTED' | 'REJECTED';
            pendingRequestId = pendingRequest.id;
        }

        return successResponse({
            isFriend,
            isSelf,
            hasPendingRequest,
            requestStatus,
            pendingRequestId
        }, "Relationship status retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
