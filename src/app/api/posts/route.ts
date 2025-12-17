import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// LIST posts
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const posts = await prisma.post.findMany({
            where: { status: "PUBLISHED" },
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
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        return NextResponse.json(
            formatResponse(true, "Posts retrieved", posts)
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
        const { title, content, images, tags } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        const post = await prisma.post.create({
            data: {
                title,
                content,
                images: images || [],
                tags: tags || [],
                authorId: user.id,
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
