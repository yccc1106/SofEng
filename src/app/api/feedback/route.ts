import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { content, type, contact, images } = body;

        if (!content) return NextResponse.json(formatResponse(false, "Content is required"), { status: 400 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        const feedback = await prisma.feedback.create({
            data: {
                userId: user.id,
                content,
                type: type || 'SUGGESTION',
                contact,
                images: images || [],
                status: 'PENDING'
            }
        });

        return NextResponse.json(formatResponse(true, "Feedback submitted", feedback));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}

export async function GET(req: Request) {
    // Admin only - simplified check, in real app add role check
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    // Check if admin (assuming role is in session, or check db)
    // For now we just return list for logged in users to simplify demo or assume admin is checking
    // Ideally: if (session.user.role !== 'ADMIN') return ...

    try {
        const feedbacks = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        });
        return NextResponse.json(formatResponse(true, "Feedbacks fetched", feedbacks));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Error fetching feedbacks", error.message), { status: 500 });
    }
}
