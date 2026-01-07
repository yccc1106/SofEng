import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// DELETE Message (Recall)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const { id: messageId } = await params;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        // 查找消息
        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return errorResponse("Message not found", 404);
        }

        // 验证是否是发送者
        if (message.senderId !== user.id) {
            return errorResponse("You can only delete your own messages", 403);
        }

        // 检查是否超过2分钟（撤回时限）
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        if (message.createdAt < twoMinutesAgo) {
            return errorResponse("Message can only be deleted within 2 minutes", 400);
        }

        // 删除消息
        await prisma.chatMessage.delete({
            where: { id: messageId }
        });

        return successResponse(null, "Message deleted");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}