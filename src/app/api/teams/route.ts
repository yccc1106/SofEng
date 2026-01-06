import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

// LIST Teams
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const mine = searchParams.get("mine") === "true";
        const categoryId = searchParams.get("categoryId");
        const session = await auth();

        const where: Prisma.TeamWhereInput = {};

        if (mine && session?.user?.id) {
            where.members = {
                some: {
                    userId: session.user.id,
                    status: "JOINED"
                }
            };
        } else {
            where.status = "RECRUITING";
            if (type) where.type = type;
            if (categoryId) where.categoryId = categoryId;
        }

        const teams = await prisma.team.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        school: true,
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                image: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        members: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return successResponse(teams, "Teams retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// CREATE Team
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return unauthorizedResponse("Unauthorized");
    }

    try {
        const body = await req.json();
        const { name, description, type, maxMembers, categoryId } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const team = await prisma.team.create({
            data: {
                name,
                description,
                type,
                maxMembers: maxMembers || 5,
                creatorId: user.id,
                categoryId: categoryId || null,
                members: {
                    create: {
                        userId: user.id,
                        role: "LEADER",
                        status: "JOINED"
                    }
                }
            },
        });

        return successResponse(team, "Team created");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
