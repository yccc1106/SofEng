import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { content, type, contact, images, reportType, reportedUserId, reportedPostId, reportedMessageId } = body;

        if (!content) return errorResponse("Content is required", 400);

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const feedback = await prisma.feedback.create({
            data: {
                userId: user.id,
                content,
                type: type || 'SUGGESTION',
                contact,
                images: images || [],
                status: 'PENDING',
                reportType,
                reportedUserId,
                reportedPostId,
                reportedMessageId
            }
        });

        return successResponse(feedback, "Feedback submitted");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const feedbacks = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } }
        });
        return successResponse(feedbacks, "Feedbacks fetched");
    } catch (error) {
        return errorResponse(
            "Error fetching feedbacks",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
