import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

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

        return NextResponse.json({
            data: formattedTeams,
            success: true,
            total: formattedTeams.length
        });
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { id, action } = body; // action: 'close' | 'restore'

        if (!id || !action) return NextResponse.json(formatResponse(false, "Missing fields"), { status: 400 });

        if (action === 'close') {
            await prisma.team.update({
                where: { id },
                data: { status: 'DISBANDED' }
            });
        }

        // Maybe handle restore if needed, or other actions

        return NextResponse.json(formatResponse(true, "Team updated"));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Update failed", error.message), { status: 500 });
    }
}
