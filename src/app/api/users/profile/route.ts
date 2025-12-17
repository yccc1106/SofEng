import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json(
            formatResponse(false, "Unauthorized"),
            { status: 401 }
        );
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
            return NextResponse.json(
                formatResponse(false, "User not found"),
                { status: 404 }
            );
        }

        return NextResponse.json(
            formatResponse(true, "User profile retrieved", user)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json(
            formatResponse(false, "Unauthorized"),
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { name, school, major, grade, bio, gender, personalityType, personalityTags } = body;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name,
                school,
                major,
                grade,
                bio,
                gender,
                personalityType,
                personalityTags,
            },
        });

        return NextResponse.json(
            formatResponse(true, "User profile updated", user)
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
