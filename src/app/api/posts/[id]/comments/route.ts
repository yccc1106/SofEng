import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

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
        return successResponse(comments, "Comments retrieved");
    } catch (error) {
        return errorResponse(
            "Error fetching comments",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// CREATE a comment
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const body = await req.json();
        const { content } = body;

        if (!content) return errorResponse("Content is required", 400);

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

        return successResponse(comment, "Comment created");
    } catch (error) {
        return errorResponse(
            "Error creating comment",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
