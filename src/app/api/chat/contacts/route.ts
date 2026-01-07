import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!currentUser) return errorResponse("User not found", 404);

        const userId = currentUser.id;

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }]
            },
            include: {
                userA: { select: { id: true, name: true, image: true, studentId: true } },
                userB: { select: { id: true, name: true, image: true, studentId: true } }
            }
        });

        const friends = friendships.map(f => {
            const friend = f.userAId === userId ? f.userB : f.userA;
            return {
                id: friend.id,
                name: friend.name || "Unknown User",
                image: friend.image,
                type: "USER"
            };
        });

        const teamMemberships = await prisma.teamMember.findMany({
            where: {
                userId: userId,
                status: "JOINED"
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });

        const teams = teamMemberships.map(tm => ({
            id: tm.team.id,
            name: tm.team.name,
            image: null,
            type: "TEAM",
            subType: tm.team.type
        }));

        return successResponse([...friends, ...teams], "Contacts retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
