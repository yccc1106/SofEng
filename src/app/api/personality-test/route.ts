import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

// This endpoint receives test answers and calculates/updates personality type
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
        const { answers, type, tags } = body;
        // In a real app, calculate type from answers on backend. 
        // For now, we accept 'type' and 'tags' directly from frontend or calculate simple logic.

        // Example: Update user profile
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                personalityType: type,
                personalityTags: tags,
            },
        });

        return NextResponse.json(
            formatResponse(true, "Personality test result saved", {
                type: user.personalityType,
                tags: user.personalityTags
            })
        );
    } catch (error: any) {
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
