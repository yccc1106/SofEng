import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const teams = await prisma.team.findMany({
            include: { creator: { select: { name: true } }, _count: { select: { members: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const formattedTeams = teams.map(t => ({
            id: t.id,
            name: t.name,
            owner: t.creator.name || 'Unknown',
            description: t.description || '',
            members: t._count.members,
            status: t.status.toLowerCase()
        }));

        return successResponse(formattedTeams, "Teams retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { id, action } = body;

        if (!id || !action) return errorResponse("Missing fields", 400);

        if (action === 'close') {
            await prisma.team.update({
                where: { id },
                data: { status: 'DISBANDED' }
            });
        }

        return successResponse(null, "Team updated");
    } catch (error) {
        return errorResponse(
            "Update failed",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
