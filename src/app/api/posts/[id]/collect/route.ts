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

        const existing = await prisma.postCollection.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId: id
                }
            }
        });

        if (existing) {
            await prisma.postCollection.delete({
                where: {
                    userId_postId: {
                        userId: user.id,
                        postId: id
                    }
                }
            });
            return successResponse(null, "Uncollected");
        } else {
            await prisma.postCollection.create({
                data: {
                    userId: user.id,
                    postId: id
                }
            });
            return successResponse(null, "Collected");
        }
    } catch (error) {
        return errorResponse(
            "Error processing collection",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
