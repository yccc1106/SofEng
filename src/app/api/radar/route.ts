import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return unauthorizedResponse("Unauthorized");

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return errorResponse("User not found", 404);

        const potentialMatches = await prisma.user.findMany({
            where: {
                id: { not: user.id },
                role: "USER"
            },
            select: {
                id: true,
                name: true,
                image: true,
                school: true,
                personalityType: true,
                personalityTags: true,
                bio: true
            }
        });

        const scoredMatches = potentialMatches.map(match => {
            let score = 0;

            if (user.personalityType && match.personalityType) {
                if (user.personalityType === match.personalityType) score += 50;
                else if (user.personalityType[0] === match.personalityType[0]) score += 20;
            }

            if (user.personalityTags && match.personalityTags) {
                const intersection = user.personalityTags.filter(t => match.personalityTags.includes(t));
                score += intersection.length * 10;
            }

            return { ...match, score };
        });

        const topMatches = scoredMatches
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        return successResponse(topMatches, "Radar matches found");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
