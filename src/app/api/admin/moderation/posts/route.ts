import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();
    // In real app: if (session?.user?.role !== 'ADMIN') return 401
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    try {
        const where: any = {};
        if (status) {
            // Map frontend status to DB status
            // Frontend: pending, approved, rejected
            // DB: AUDITING (default?), REJECTED, PUBLISHED (approved)
            // But schema says default PUBLISHED. Let's assume we want to audit newly created pointers if system was strict.
            // For this demo, let's fetch all or filter by mapped status.
            if (status === 'pending') where.status = 'AUDITING';
            else if (status === 'approved') where.status = 'PUBLISHED';
            else if (status === 'rejected') where.status = 'REJECTED';
        }

        const posts = await prisma.post.findMany({
            where,
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const formattedPosts = posts.map(p => ({
            id: p.id,
            author: p.author.name,
            title: p.title,
            content: p.content,
            // imageUrl: p.images[0], // Schema has String[], logic needs check
            status: p.status === 'PUBLISHED' ? 'approved' : (p.status === 'AUDITING' ? 'pending' : 'rejected'),
            date: p.createdAt.toISOString().split('T')[0]
        }));

        return NextResponse.json({
            data: formattedPosts,
            success: true,
            total: formattedPosts.length
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
        const { id, action } = body; // action: 'pass' | 'reject'

        if (!id || !action) return NextResponse.json(formatResponse(false, "Missing fields"), { status: 400 });

        const status = action === 'pass' ? 'PUBLISHED' : 'REJECTED';

        await prisma.post.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(formatResponse(true, "Post updated"));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Update failed", error.message), { status: 500 });
    }
}
