import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const userId = session.user.id;

        // Fetch Friends
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

        // Fetch Joined Teams
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
            image: null, // Teams usually don't have images in this schema, can use default icon
            type: "TEAM",
            subType: tm.team.type
        }));

        return NextResponse.json(formatResponse(true, "Contacts retrieved", [...friends, ...teams]));

    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}
