import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const messages = await prisma.chatMessage.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { name: true } },
                receiver: { select: { name: true } }
            }
        });

        const formattedMessages = messages.map(m => ({
            id: m.id,
            sender: m.sender.name || 'Unknown',
            receiver: m.receiver?.name || 'Group/Team',
            content: m.content,
            riskLevel: 'unknown',
            timestamp: m.createdAt.toISOString()
        }));

        return successResponse(formattedMessages, "Messages retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return errorResponse("ID required", 400);

        await prisma.chatMessage.delete({
            where: { id }
        });

        return successResponse(null, "Message deleted");
    } catch (error) {
        return errorResponse(
            "Delete failed",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
