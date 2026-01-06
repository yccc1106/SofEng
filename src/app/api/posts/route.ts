import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

// LIST posts
export async function GET(req: Request) {
    try {
        const session = await auth();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const categoryId = searchParams.get("categoryId");
        const skip = (page - 1) * limit;

        let userId: string | null = null;
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
            userId = user?.id || null;
        }

        const where: Prisma.PostWhereInput = { status: "PUBLISHED" };
        if (categoryId) {
            where.categoryId = categoryId;
        }

        const posts = await prisma.post.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        school: true,
                        role: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        collections: true,
                        comments: true,
                    }
                },
                likes: userId ? {
                    where: { userId: userId },
                    select: { userId: true }
                } : undefined,
                collections: userId ? {
                    where: { userId: userId },
                    select: { userId: true }
                } : undefined,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        const formattedPosts = posts.map(post => ({
            ...post,
            isLiked: post.likes ? post.likes.length > 0 : false,
            isCollected: post.collections ? post.collections.length > 0 : false,
            likes: undefined,
            collections: undefined,
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

// CREATE post
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return unauthorizedResponse("Unauthorized");
    }

    try {
        const body = await req.json();
        const { title, content, images, tags, categoryId } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const post = await prisma.post.create({
            data: {
                title,
                content,
                images: images || [],
                tags: tags || [],
                authorId: user.id,
                categoryId: categoryId || null
            },
        });

        return successResponse(post, "Post created");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
