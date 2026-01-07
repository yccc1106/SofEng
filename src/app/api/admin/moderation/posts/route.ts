import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

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

        const status = action === 'pass' ? 'PUBLISHED' : 'REJECTED';

        await prisma.post.update({
            where: { id },
            data: { status }
        });

        return successResponse(null, "Post updated");
    } catch (error) {
        return errorResponse(
            "Update failed",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
