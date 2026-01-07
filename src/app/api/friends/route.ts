import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// LIST Friends
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

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

        return successResponse(friends, "Friends retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
