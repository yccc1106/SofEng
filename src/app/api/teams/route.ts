import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// LIST Teams
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        const where: any = {
            status: "RECRUITING"
        };
        if (type) where.type = type;

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

        return NextResponse.json(
            formatResponse(true, "Teams retrieved", teams)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}

// CREATE Team
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json(
            formatResponse(false, "Unauthorized"),
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { name, description, type, maxMembers } = body;

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        const team = await prisma.team.create({
            data: {
                name,
                description,
                type,
                maxMembers: maxMembers || 5,
                creatorId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: "LEADER",
                        status: "JOINED"
                    }
                }
            },
        });

        return NextResponse.json(
            formatResponse(true, "Team created", team),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
