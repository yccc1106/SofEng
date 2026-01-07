import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";
import { publishMessage } from "@/lib/redis";
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

        // 私聊需要验证好友关系
        if (receiverId && !teamId && !categoryId) {
            // 检查是否是好友
            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { userAId: user.id, userBId: receiverId },
                        { userAId: receiverId, userBId: user.id }
                    ]
                }
            });

            if (!friendship) {
                return errorResponse("You need to be friends to send messages", 403);
            }
        }

        // 群聊需要验证队伍成员身份
        if (teamId) {
            const teamMember = await prisma.teamMember.findFirst({
                where: {
                    teamId,
                    userId: user.id,
                    status: "JOINED"
                }
            });

            if (!teamMember) {
                return errorResponse("You are not a member of this team", 403);
            }
        }

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

        // 转换消息格式，确保 CreatedAt 是 ISO 字符串
        const messageForRedis = {
            id: message.id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            receiverId: message.receiverId,
            teamId: message.teamId,
            categoryId: message.categoryId,
            createdAt: message.createdAt.toISOString(),
            sender: message.sender
        };

        // 计算房间名称并发布到 Redis
        let room = '';
        if (categoryId) {
            room = `interest:${categoryId}`;
        } else if (teamId) {
            room = `team:${teamId}`;
        } else if (receiverId) {
            // 私聊房间：按字母顺序排序确保唯一
            const sorted = [user.id, receiverId].sort();
            room = `dm:${sorted[0]}_${sorted[1]}`;
        }

        // 发布消息到 Redis 频道
        await publishMessage('chat:message', { room, message: messageForRedis });

        return successResponse(message, "Message sent");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
