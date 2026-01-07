import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";

// GET User by ID
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                image: true,
                bio: true,
                school: true,
                major: true,
                grade: true,
                personalityType: true,
                personalityTags: true,
                role: true,
                createdAt: true,
            }
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        // 解析 personalityTags
        const userData = {
            ...user,
            personalityTags: typeof user.personalityTags === 'string'
                ? JSON.parse(user.personalityTags)
                : user.personalityTags || []
        };

        return successResponse(userData, "User retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
