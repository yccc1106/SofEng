import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return unauthorizedResponse("Unauthorized");
    }

    try {
        const body = await req.json();
        const { teamId, message: joinMessage } = body;

        if (!teamId) {
            return errorResponse("Team ID is required", 400);
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
            return errorResponse("Team not found", 404);
        }

        if (team.status !== "RECRUITING") {
            return errorResponse("Team is not recruiting", 400);
        }

        if (team._count.members >= team.maxMembers) {
            return errorResponse("Team is full", 400);
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
                return errorResponse("Already a member of this team", 400);
            } else if (existingMember.status === "PENDING") {
                return errorResponse("Application already pending", 400);
            }
        }

        // Determine status based on team settings
        const status = team.requiresApproval ? "PENDING" : "JOINED";

        // Join team or create request
        const teamMember = await prisma.teamMember.create({
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

        return successResponse(teamMember, responseMsg);
    } catch (error) {
        console.error("Join team error:", error);
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
