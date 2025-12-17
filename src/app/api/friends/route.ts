import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// LIST Friends
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userAId: user.id },
                    { userBId: user.id }
                ]
            },
            include: {
                userA: { select: { id: true, name: true, image: true, school: true, role: true } },
                userB: { select: { id: true, name: true, image: true, school: true, role: true } }
            }
        });

        const friends = friendships.map(f => {
            if (f.userAId === user.id) return f.userB;
            return f.userA;
        });

        return NextResponse.json(
            formatResponse(true, "Friends retrieved", friends)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
