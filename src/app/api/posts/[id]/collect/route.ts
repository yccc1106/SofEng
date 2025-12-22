import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json(formatResponse(false, "User not found"), { status: 404 });

        const existing = await prisma.postCollection.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId: id
                }
            }
        });

        if (existing) {
            await prisma.postCollection.delete({
                where: {
                    userId_postId: {
                        userId: user.id,
                        postId: id
                    }
                }
            });
            return NextResponse.json(formatResponse(true, "Uncollected"));
        } else {
            await prisma.postCollection.create({
                data: {
                    userId: user.id,
                    postId: id
                }
            });
            return NextResponse.json(formatResponse(true, "Collected"));
        }
    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Error processing collection", error.message), { status: 500 });
    }
}
