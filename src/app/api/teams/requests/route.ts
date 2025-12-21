import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// List pending requests for teams created by current user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

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

        return NextResponse.json(formatResponse(true, "Requests retrieved", requests));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}

// Approve or Reject a request
export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { memberId, status } = body; // status: "JOINED" or "REJECTED" (or status can delete if rejected)

        if (!memberId || !["JOINED", "REJECTED"].includes(status)) {
            return NextResponse.json(formatResponse(false, "Invalid data"), { status: 400 });
        }

        const member = await prisma.teamMember.findUnique({
            where: { id: memberId },
            include: { team: true }
        });

        if (!member) return NextResponse.json(formatResponse(false, "Request not found"), { status: 404 });

        // Check if current user is the leader
        if (member.team.creatorId !== session.user.id) {
            return NextResponse.json(formatResponse(false, "Forbidden"), { status: 403 });
        }

        if (status === "REJECTED") {
            await prisma.teamMember.delete({ where: { id: memberId } });
            return NextResponse.json(formatResponse(true, "Request rejected"));
        }

        // Approve
        const updatedMember = await prisma.teamMember.update({
            where: { id: memberId },
            data: { status: "JOINED" }
        });

        // Check if team is now full
        const memberCount = await prisma.teamMember.count({
            where: { teamId: member.teamId, status: "JOINED" }
        });

        if (memberCount >= member.team.maxMembers) {
            await prisma.team.update({
                where: { id: member.teamId },
                data: { status: "FULL" }
            });
        }

        return NextResponse.json(formatResponse(true, "Request approved", updatedMember));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}
