import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, studentId, school } = body;

        if (!email || !password || !name) {
            return errorResponse("Missing required fields", 400);
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return errorResponse("User already exists", 409);
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                studentId,
                school,
                role: "USER"
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return successResponse(userWithoutPassword, "User created successfully");

    } catch (error) {
        console.error("Registration error:", error);
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
