import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

// This endpoint receives test answers and calculates/updates personality type
export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return unauthorizedResponse("Unauthorized");
    }

    try {
        const body = await req.json();
        const { answers, type, tags } = body;

        // Update user profile
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                personalityType: type,
                personalityTags: tags,
            },
        });

        return successResponse({
            type: user.personalityType,
            tags: user.personalityTags
        }, "Personality test result saved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
