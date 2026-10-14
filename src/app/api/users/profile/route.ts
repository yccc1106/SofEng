import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return unauthorizedResponse("Unauthorized");
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                studentId: true,
                school: true,
                major: true,
                grade: true,
                bio: true,
                gender: true,
                personalityType: true,
                personalityTags: true,
            },
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        return successResponse(user, "User profile retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function PUT(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return unauthorizedResponse("Unauthorized");
    }

    try {
        const body = await req.json();
        const { name, school, major, grade, bio, gender } = body;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name,
                school,
                major,
                grade,
                bio,
                gender,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                studentId: true,
                school: true,
                major: true,
                grade: true,
                bio: true,
                gender: true,
                personalityType: true,
                personalityTags: true,
            },
        });

        return successResponse(user, "User profile updated");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
