import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: requestId } = await params;
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { action } = body; // ACCEPT, REJECT

        const request = await prisma.friendRequest.findUnique({
            where: { id: requestId },
            include: { sender: true, receiver: true }
        });

        if (!request) return NextResponse.json(formatResponse(false, "Request not found"), { status: 404 });

        // Only receiver can accept/reject
        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (request.receiverId !== currentUser?.id) {
            return NextResponse.json(formatResponse(false, "Forbidden"), { status: 403 });
        }

        if (action === "ACCEPT") {
            // Transaction to update request and create friendship
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
            return NextResponse.json(formatResponse(true, "Request accepted"));
        } else if (action === "REJECT") {
            await prisma.friendRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" }
            });
            return NextResponse.json(formatResponse(true, "Request rejected"));
        } else {
            return NextResponse.json(formatResponse(false, "Invalid action"), { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
