import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/response";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const categories = await prisma.category.findMany({
            include: { parent: { select: { name: true } } },
            orderBy: { usageCount: 'desc' }
        });

        const formattedCategories = categories.map(c => ({
            id: c.id,
            name: c.name,
            parent: c.parent?.name || '-',
            description: c.description,
            count: c.usageCount
        }));

        return successResponse(formattedCategories, "Categories retrieved");
    } catch (error) {
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { name, parentId, description } = body;

        if (!name) return errorResponse("Name is required", 400);

        const category = await prisma.category.create({
            data: {
                name,
                parentId: parentId || null,
                description
            }
        });

        return successResponse(category, "Category created");
    } catch (error) {
        return errorResponse(
            "Create failed",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const body = await req.json();
        const { id, name, parentId, description } = body;

        if (!id) return errorResponse("ID is required", 400);

        await prisma.category.update({
            where: { id },
            data: {
                name,
                parentId: parentId || null,
                description
            }
        });

        return successResponse(null, "Category updated");
    } catch (error) {
        return errorResponse(
            "Update failed",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return errorResponse("ID is required", 400);

        await prisma.category.delete({
            where: { id }
        });

        return successResponse(null, "Category deleted");
    } catch (error) {
        return errorResponse(
            "Delete failed",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
