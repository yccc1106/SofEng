import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// GET Notification Count
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        // 计算未读通知数量
        let count = 0;

        // 待处理的好友请求
        const pendingFriendRequests = await prisma.friendRequest.count({
            where: {
                receiverId: user.id,
                status: "PENDING"
            }
        });
        count += pendingFriendRequests;

        // 队伍入队申请（如果用户是队长）
        const pendingTeamRequests = await prisma.teamMember.count({
            where: {
                team: { creatorId: user.id },
                status: "PENDING"
            }
        });
        count += pendingTeamRequests;

        return successResponse(count, "Notification count retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}