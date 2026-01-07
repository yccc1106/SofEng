import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

// GET Messages (params: targetId (userId), teamId, limit)
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get("userId");
        const teamId = searchParams.get("teamId");
        const categoryId = searchParams.get("categoryId");

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const where: Prisma.ChatMessageWhereInput = {};
        if (categoryId) {
            where.categoryId = categoryId;
        } else if (teamId) {
            where.teamId = teamId;
        } else if (targetUserId) {
            where.OR = [
                { senderId: user.id, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: user.id }
            ];
        } else {
            return errorResponse("Missing userId or teamId or categoryId", 400);
        }

        const messages = await prisma.chatMessage.findMany({
            where,
            orderBy: { createdAt: "asc" },
            include: {
                sender: { select: { id: true, name: true, image: true } }
            },
            take: 100
        });

        return successResponse(messages, "Messages retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// SEND Message
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { content, receiverId, teamId, categoryId, type } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const message = await prisma.chatMessage.create({
            data: {
                content,
                type: type || "TEXT",
                senderId: user.id,
                receiverId,
                teamId,
                categoryId
            },
            include: {
                sender: { select: { id: true, name: true, image: true } }
            }
        });

        return successResponse(message, "Message sent");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
