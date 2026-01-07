import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.email) {
            return unauthorizedResponse("Unauthorized");
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const existing = await prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId: id
                }
            }
        });

        if (existing) {
            await prisma.postLike.delete({
                where: {
                    userId_postId: {
                        userId: user.id,
                        postId: id
                    }
                }
            });
            return successResponse(null, "Unliked");
        } else {
            await prisma.postLike.create({
                data: {
                    userId: user.id,
                    postId: id
                }
            });
            return successResponse(null, "Liked");
        }
    } catch (error) {
        return errorResponse(
            "Error processing like",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
