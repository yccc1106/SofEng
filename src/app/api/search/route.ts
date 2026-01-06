import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
        return successResponse({ users: [], posts: [], teams: [] }, "No query provided");
    }

    try {
        const [users, posts, teams] = await Promise.all([
            // Search Users
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { bio: { contains: q, mode: 'insensitive' } }
                    ],
                    role: 'USER'
                },
                select: { id: true, name: true, image: true, bio: true, personalityType: true },
                take: 5
            }),
            // Search Posts
            prisma.post.findMany({
                where: {
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { content: { contains: q, mode: 'insensitive' } }
                    ]
                },
                include: { author: { select: { name: true, image: true } } },
                take: 5
            }),
            // Search Teams
            prisma.team.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { description: { contains: q, mode: 'insensitive' } }
                    ]
                },
                include: { creator: { select: { name: true } }, _count: { select: { members: true } } },
                take: 5
            })
        ]);

        return successResponse({ users, posts, teams }, "Search results");
    } catch (error) {
        return errorResponse(
            "Search failed",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
