import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

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

        return NextResponse.json({
            data: formattedCategories,
            success: true,
            total: formattedCategories.length
        });
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { name, parentId, description } = body;

        if (!name) return NextResponse.json(formatResponse(false, "Name is required"), { status: 400 });

        const category = await prisma.category.create({
            data: {
                name,
                parentId: parentId || null,
                description
            }
        });

        return NextResponse.json(formatResponse(true, "Category created", category));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Create failed", error.message), { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const body = await req.json();
        const { id, name, parentId, description } = body;

        if (!id) return NextResponse.json(formatResponse(false, "ID is required"), { status: 400 });

        await prisma.category.update({
            where: { id },
            data: {
                name,
                parentId: parentId || null, // Allow removing parent by sending null via undefined check if key exists
                description
            }
        });

        return NextResponse.json(formatResponse(true, "Category updated"));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Update failed", error.message), { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json(formatResponse(false, "ID is required"), { status: 400 });

        await prisma.category.delete({
            where: { id }
        });

        return NextResponse.json(formatResponse(true, "Category deleted"));
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Delete failed", error.message), { status: 500 });
    }
}
