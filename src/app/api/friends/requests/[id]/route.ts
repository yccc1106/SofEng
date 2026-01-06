import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: requestId } = await params;
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { action } = body;

        const request = await prisma.friendRequest.findUnique({
            where: { id: requestId },
            include: { sender: true, receiver: true }
        });

        if (!request) return errorResponse("Request not found", 404);

        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (request.receiverId !== currentUser?.id) {
            return errorResponse("Forbidden", 403);
        }

        if (action === "ACCEPT") {
            await prisma.$transaction([
                prisma.friendRequest.update({
                    where: { id: requestId },
                    data: { status: "ACCEPTED" }
                }),
                prisma.friendship.create({
                    data: {
                        userAId: request.senderId,
                        userBId: request.receiverId,
                        status: "FRIEND"
                    }
                })
            ]);
            return successResponse(null, "Request accepted");
        } else if (action === "REJECT") {
            await prisma.friendRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" }
            });
            return successResponse(null, "Request rejected");
        } else {
            return errorResponse("Invalid action", 400);
        }

    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
