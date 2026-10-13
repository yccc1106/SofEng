import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");
    if (session.user.role !== 'ADMIN') return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    try {
        const where: Prisma.PostWhereInput = {};
        if (status) {
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
            status: p.status === 'PUBLISHED' ? 'approved' : (p.status === 'AUDITING' ? 'pending' : 'rejected'),
            date: p.createdAt.toISOString().split('T')[0]
        }));

        return successResponse(formattedPosts, "Posts retrieved");
    } catch {
        return errorResponse("Internal server error", 500);
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");
    if (session.user.role !== 'ADMIN') return forbiddenResponse();

    try {
        const body = await req.json();
        const { id, action } = body;

        if (typeof id !== 'string' || !['pass', 'reject'].includes(action)) return errorResponse("Invalid action", 400);

        const status = action === 'pass' ? 'PUBLISHED' : 'REJECTED';

        const updated = await prisma.post.updateMany({
            where: { id, status: 'AUDITING' },
            data: { status }
        });
        if (updated.count === 0) return errorResponse("Post is not pending review", 409);

        return successResponse(null, "Post updated");
    } catch {
        return errorResponse("Update failed", 500);
    }
}
