import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// MARK Messages as Read
export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { userId, teamId, categoryId } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        // 更新私聊消息已读状态
        if (userId && !teamId && !categoryId) {
            const result = await prisma.chatMessage.updateMany({
                where: {
                    senderId: userId,
                    receiverId: user.id,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            return successResponse({ count: result.count }, "Messages marked as read");
        }

        // 更新群聊消息已读状态
        if (teamId) {
            const result = await prisma.chatMessage.updateMany({
                where: {
                    teamId,
                    receiverId: null,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            return successResponse({ count: result.count }, "Team messages marked as read");
        }

        // 更新兴趣圈消息已读状态
        if (categoryId) {
            const result = await prisma.chatMessage.updateMany({
                where: {
                    categoryId,
                    senderId: { not: user.id },
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            return successResponse({ count: result.count }, "Interest messages marked as read");
        }

        return errorResponse("Missing userId, teamId, or categoryId", 400);
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
