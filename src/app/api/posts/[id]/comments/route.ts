import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// GET comments for a post
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const comments = await prisma.postComment.findMany({
            where: { postId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        school: true,
                        role: true,
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        return NextResponse.json(formatResponse(true, "Comments retrieved", comments));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Error fetching comments", error.message), { status: 500 });
    }
}

// CREATE a comment
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        const body = await req.json();
        const { content } = body;

        if (!content) return NextResponse.json(formatResponse(false, "Content is required"), { status: 400 });

        const comment = await prisma.postComment.create({
            data: {
                content,
                postId: id,
                userId: user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        school: true,
                    }
                }
            }
        });

        return NextResponse.json(formatResponse(true, "Comment created", comment));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Error creating comment", error.message), { status: 500 });
    }
}
