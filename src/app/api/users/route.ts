import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword, formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, studentId, school } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                formatResponse(false, "Missing required fields"),
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                formatResponse(false, "User already exists"),
                { status: 409 }
            );
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

        return NextResponse.json(
            formatResponse(true, "User created successfully", userWithoutPassword),
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            formatResponse(false, "Internal server error", error.message),
            { status: 500 }
        );
    }
}
