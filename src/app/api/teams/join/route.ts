import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json(
            formatResponse(false, "Unauthorized"),
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { teamId } = body;

        if (!teamId) {
            return NextResponse.json(
                formatResponse(false, "Team ID is required"),
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        // Check if team exists and is recruiting
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!team) {
            return NextResponse.json(
                formatResponse(false, "Team not found"),
                { status: 404 }
            );
        }

        if (team.status !== "RECRUITING") {
            return NextResponse.json(
                formatResponse(false, "Team is not recruiting"),
                { status: 400 }
            );
        }

        if (team._count.members >= team.maxMembers) {
            return NextResponse.json(
                formatResponse(false, "Team is full"),
                { status: 400 }
            );
        }

        // Check if already a member
        const existingMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: user.id
                }
            }
        });

        if (existingMember) {
            return NextResponse.json(
                formatResponse(false, "Already a member of this team"),
                { status: 400 }
            );
        }

        // Join team
        const teamMember = await prisma.teamMember.create({
            data: {
                teamId,
                userId: user.id,
                role: "MEMBER",
                status: "JOINED"
            }
        });

        // Update team status if full
        if (team._count.members + 1 >= team.maxMembers) {
            await prisma.team.update({
                where: { id: teamId },
                data: { status: "FULL" }
            });
        }

        return NextResponse.json(
            formatResponse(true, "Joined team successfully", teamMember)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
