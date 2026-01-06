import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// LIST Friend Requests (Received)
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "received";

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        let requests;
        if (type === "sent") {
            requests = await prisma.friendRequest.findMany({
                where: { senderId: user.id },
                include: { receiver: { select: { id: true, name: true, image: true, school: true } } }
            });
        } else {
            requests = await prisma.friendRequest.findMany({
                where: { receiverId: user.id, status: "PENDING" },
                include: { sender: { select: { id: true, name: true, image: true, school: true } } }
            });
        }

        return successResponse(requests, "Friend requests retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// SEND Friend Request
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { receiverId, message } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const existing = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: user.id, receiverId },
                    { senderId: receiverId, receiverId: user.id }
                ],
                status: "PENDING"
            }
        });

        if (existing) {
            return errorResponse("Request already pending", 409);
        }

        const request = await prisma.friendRequest.create({
            data: {
                senderId: user.id,
                receiverId,
                message,
                status: "PENDING"
            },
        });

        return successResponse(request, "Friend request sent");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
