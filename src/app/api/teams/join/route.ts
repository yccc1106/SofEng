import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json(
            formatResponse(false, "Unauthorized"),
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { teamId, message: joinMessage } = body;

        if (!teamId) {
            return NextResponse.json(
                formatResponse(false, "Team ID is required"),
                { status: 400 }
            );
        }

        // Check if team exists
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                _count: {
                    select: { members: { where: { status: "JOINED" } } }
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

        // Check if already a member or pending
        const existingMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: session.user.id
                }
            }
        });

        if (existingMember) {
            if (existingMember.status === "JOINED") {
                return NextResponse.json(
                    formatResponse(false, "Already a member of this team"),
                    { status: 400 }
                );
            } else if (existingMember.status === "PENDING") {
                return NextResponse.json(
                    formatResponse(false, "Application already pending"),
                    { status: 400 }
                );
            }
        }

        // Determine status based on team settings
        const status = (team as any).requiresApproval ? "PENDING" : "JOINED";

        // Join team or create request
        // Adding a comment to force dev server reload
        const teamMember = await (prisma.teamMember as any).create({
            data: {
                teamId,
                userId: session.user.id,
                role: "MEMBER",
                status,
                joinMessage: joinMessage || ""
            }
        });

        // Update team status if full (only if joined directly)
        if (status === "JOINED" && team._count.members + 1 >= team.maxMembers) {
            await prisma.team.update({
                where: { id: teamId },
                data: { status: "FULL" }
            });
        }

        const responseMsg = status === "PENDING"
            ? "Application sent successfully"
            : "Joined team successfully";

        return NextResponse.json(
            formatResponse(true, responseMsg, teamMember)
        );
    } catch (error: any) {
        console.error("Join team error:", error);
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
