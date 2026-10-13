import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");
    if (session.user.role !== 'ADMIN') return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // SUGGESTION, REPORT

    try {
        const where: Prisma.FeedbackWhereInput = {};
        if (type) {
            where.type = type;
        }

        const feedbacks = await prisma.feedback.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                reportedUser: { select: { id: true, name: true, email: true, status: true } },
                reportedPost: { select: { id: true, title: true, content: true, status: true } },
                reportedMessage: { select: { id: true, content: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedFeedbacks = feedbacks.map(f => ({
            id: f.id,
            user: f.user?.name || 'Anonymous',
            suggestion: f.content,
            status: f.status,
            date: f.createdAt.toISOString().split('T')[0],
            type: f.type,
            reportType: f.reportType,
            target: f.reportType === 'USER' ? f.reportedUser :
                f.reportType === 'POST' ? f.reportedPost :
                    f.reportType === 'MESSAGE' ? f.reportedMessage : null
        }));

        return successResponse(formattedFeedbacks, "Feedbacks retrieved");
    } catch {
        return errorResponse("Internal server error", 500);
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");
    if (session.user.role !== 'ADMIN') return forbiddenResponse();

    try {
        const body = await req.json();
        const { id, status, action } = body;

        if (!id || !status) return errorResponse("Missing fields", 400);

        // Handle specific actions
        if (action) {
            const feedback = await prisma.feedback.findUnique({ where: { id } });
            if (feedback) {
                if (action === 'BAN_USER' && feedback.reportedUserId) {
                    await prisma.user.update({
                        where: { id: feedback.reportedUserId },
                        data: { status: 'BANNED' }
                    });
                } else if (action === 'DELETE_POST' && feedback.reportedPostId) {
                    await prisma.post.update({
                        where: { id: feedback.reportedPostId },
                        data: { status: 'DELETED' }
                    });
                }
            }
        }

        await prisma.feedback.update({
            where: { id },
            data: { status }
        });

        return successResponse(null, "Feedback updated");
    } catch {
        return errorResponse("Update failed", 500);
    }
}
