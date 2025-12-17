import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// LIST Friend Requests (Received)
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "received"; // received or sent

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

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

        return NextResponse.json(
            formatResponse(true, "Friend requests retrieved", requests)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}

// SEND Friend Request
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { receiverId, message } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        // Check existing request or friendship
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
            return NextResponse.json(formatResponse(false, "Request already pending"), { status: 409 });
        }

        const request = await prisma.friendRequest.create({
            data: {
                senderId: user.id,
                receiverId,
                message,
                status: "PENDING"
            },
        });

        return NextResponse.json(
            formatResponse(true, "Friend request sent", request),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
