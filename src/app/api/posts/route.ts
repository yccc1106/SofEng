import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// LIST posts
export async function GET(req: Request) {
    try {
        const session = await auth();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const categoryId = searchParams.get("categoryId"); // Extract categoryId
        const skip = (page - 1) * limit;

        let userId: string | null = null;
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
            userId = user?.id || null;
        }

        const where: any = { status: "PUBLISHED" };
        if (categoryId) {
            where.categoryId = categoryId;
        }

        const posts = await prisma.post.findMany({
            where: where,
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

        return NextResponse.json(
            formatResponse(true, "Posts retrieved", formattedPosts)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}

// CREATE post
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json(
            formatResponse(false, "Unauthorized"),
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { title, content, images, tags, categoryId } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

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

        return NextResponse.json(
            formatResponse(true, "Post created", post),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
