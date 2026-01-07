import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// GET Notifications
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        // TODO: 创建通知模型后从这里获取
        // 目前返回空列表
        const notifications: any[] = [];

        // 好友请求通知
        const friendRequests = await prisma.friendRequest.findMany({
            where: {
                receiverId: user.id,
                status: "PENDING"
            },
            include: {
                sender: { select: { id: true, name: true, image: true } }
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset
        });

        const friendRequestNotifications = friendRequests.map(req => ({
            id: `friend-request-${req.id}`,
            type: 'FRIEND_REQUEST',
            title: 'New Friend Request',
            message: `${req.sender.name} wants to be your friend`,
            link: '/user/friends',
            isRead: false,
            createdAt: req.createdAt
        }));

        // 队伍申请通知
        const teamJoinRequests = await prisma.teamMember.findMany({
            where: {
                team: { creatorId: user.id },
                status: "PENDING"
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
                team: { select: { id: true, name: true } }
            },
            orderBy: { joinedAt: "desc" }
        });

        const teamNotifications = teamJoinRequests.map(req => ({
            id: `team-request-${req.id}`,
            type: 'TEAM_REQUEST',
            title: 'New Team Join Request',
            message: `${req.user.name} wants to join ${req.team.name}`,
            link: `/user/teams/${req.team.id}`,
            isRead: false,
            createdAt: req.joinedAt
        }));

        const allNotifications = [...friendRequestNotifications, ...teamNotifications]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(offset, offset + limit);

        return successResponse(allNotifications, "Notifications retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
