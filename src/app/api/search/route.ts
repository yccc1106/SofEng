import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
        return NextResponse.json(formatResponse(true, "No query provided", { users: [], posts: [], teams: [] }));
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

        return NextResponse.json(formatResponse(true, "Search results", { users, posts, teams }));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Search failed", error.message), { status: 500 });
    }
}
