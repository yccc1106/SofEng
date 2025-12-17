import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // SUGGESTION, REPORT

    try {
        const where: any = {};
        if (type) {
            where.type = type;
        }

        const feedbacks = await prisma.feedback.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const formattedFeedbacks = feedbacks.map(f => ({
            id: f.id,
            user: f.user?.name || 'Anonymous',
            suggestion: f.content,
            status: f.status === 'PROCESSED' ? 'processed' : 'pending',
            date: f.createdAt.toISOString().split('T')[0],
            type: f.type
        }));

        return NextResponse.json({
            data: formattedFeedbacks,
            success: true,
            total: formattedFeedbacks.length
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
        const { id, status } = body;

        if (!id || !status) return NextResponse.json(formatResponse(false, "Missing fields"), { status: 400 });

        await prisma.feedback.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(formatResponse(true, "Feedback updated"));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Update failed", error.message), { status: 500 });
    }
}
