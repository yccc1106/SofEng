// src/app/api/category/route.ts
import { NextRequest } from 'next/server';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                usageCount: 'desc'
            }
        });

        return Response.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return Response.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }finally {
        await prisma.$disconnect();
    }
}
