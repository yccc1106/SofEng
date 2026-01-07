import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// DELETE Friend
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const { userId: friendId } = await params;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        // 不能删除自己
        if (user.id === friendId) {
            return errorResponse("Cannot remove yourself", 400);
        }

        // 查找并删除好友关系
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userAId: user.id, userBId: friendId },
                    { userAId: friendId, userBId: user.id }
                ]
            }
        });

        if (!friendship) {
            return errorResponse("Friendship not found", 404);
        }

        await prisma.friendship.delete({
            where: { id: friendship.id }
        });

        return successResponse(null, "Friend removed");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
