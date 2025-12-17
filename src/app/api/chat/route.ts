import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// GET Messages (params: targetId (userId), teamId, limit)
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get("userId");
        const teamId = searchParams.get("teamId");

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        let where: any = {};
        if (teamId) {
            where = { teamId };
        } else if (targetUserId) {
            where = {
                OR: [
                    { senderId: user.id, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: user.id }
                ]
            };
        } else {
            return NextResponse.json(formatResponse(false, "Missing userId or teamId"), { status: 400 });
        }

        const messages = await prisma.chatMessage.findMany({
            where,
            orderBy: { createdAt: "asc" },
            include: {
                sender: { select: { id: true, name: true, image: true } }
            },
            take: 100 // Limit for now
        });

        return NextResponse.json(
            formatResponse(true, "Messages retrieved", messages)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}

// SEND Message
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { content, receiverId, teamId, type } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        const message = await prisma.chatMessage.create({
            data: {
                content,
                type: type || "TEXT",
                senderId: user.id,
                receiverId, // Optional
                teamId      // Optional
            },
            include: {
                sender: { select: { id: true, name: true, image: true } }
            }
        });

        return NextResponse.json(
            formatResponse(true, "Message sent", message),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
