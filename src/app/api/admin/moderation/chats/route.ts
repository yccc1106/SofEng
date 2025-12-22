import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        // Fetch simplified list of messages for moderation demo
        // Ideally we would have a 'ReportedMessage' or 'FlaggedMessage' concept.
        // For now, let's just fetch recent messages or maybe use a keyword filter if implemented.
        // Actually, let's fetch messages that might have been reported or just all recent ones.
        // Given the requirement "moderation/chats", let's assume we are reviewing all or flagged ones.
        // Let's fetch recent 50 messages.

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
            riskLevel: 'unknown', // Placeholder as we don't have AI risk analysis yet
            timestamp: m.createdAt.toISOString()
        }));

        return NextResponse.json({
            data: formattedMessages,
            success: true,
            total: formattedMessages.length
        });
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json(formatResponse(false, "ID required"), { status: 400 });

        await prisma.chatMessage.delete({
            where: { id }
        });

        return NextResponse.json(formatResponse(true, "Message deleted"));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Delete failed", error.message), { status: 500 });
    }
}
