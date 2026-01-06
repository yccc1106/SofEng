import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// List pending requests for teams created by current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse("Unauthorized");

    try {
        const requests = await prisma.teamMember.findMany({
            where: {
                team: {
                    creatorId: session.user.id
                },
                status: "PENDING"
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        school: true
                    }
                },
                team: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { joinedAt: "desc" }
        });

        return successResponse(requests, "Requests retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// Approve or Reject a request
export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { memberId, status } = body;

        if (!memberId || !["JOINED", "REJECTED"].includes(status)) {
            return errorResponse("Invalid data", 400);
        }

        const member = await prisma.teamMember.findUnique({
            where: { id: memberId },
            include: { team: true }
        });

        if (!member) return errorResponse("Request not found", 404);

        if (member.team.creatorId !== session.user.id) {
            return errorResponse("Forbidden", 403);
        }

        if (status === "REJECTED") {
            await prisma.teamMember.delete({ where: { id: memberId } });
            return successResponse(null, "Request rejected");
        }

        const updatedMember = await prisma.teamMember.update({
            where: { id: memberId },
            data: { status: "JOINED" }
        });

        const memberCount = await prisma.teamMember.count({
            where: { teamId: member.teamId, status: "JOINED" }
        });

        if (memberCount >= member.team.maxMembers) {
            await prisma.team.update({
                where: { id: member.teamId },
                data: { status: "FULL" }
            });
        }

        return successResponse(updatedMember, "Request approved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
