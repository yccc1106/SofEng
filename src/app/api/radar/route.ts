import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        // Simplified Radar Algorithm: Find users with same personality type or sharing tags
        // Exclude self and already friends (mock logic for friends exclusion)

        // Get all users except self
        const potentialMatches = await prisma.user.findMany({
            where: {
                id: { not: user.id },
                role: "USER" // Only match normal users
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

        // Score and sort matches
        const scoredMatches = potentialMatches.map(match => {
            let score = 0;

            // Personality Type Match (e.g. share first or last letter)
            if (user.personalityType && match.personalityType) {
                if (user.personalityType === match.personalityType) score += 50;
                else if (user.personalityType[0] === match.personalityType[0]) score += 20;
            }

            // Tags Overlap
            if (user.personalityTags && match.personalityTags) {
                const intersection = user.personalityTags.filter(t => match.personalityTags.includes(t));
                score += intersection.length * 10;
            }

            return { ...match, score };
        });

        // Sort by score descending and take top 5
        const topMatches = scoredMatches
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        return NextResponse.json(
            formatResponse(true, "Radar matches found", topMatches)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
