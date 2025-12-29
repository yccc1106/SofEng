import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - 获取单个用户详细信息 (P1.10 查看用户个人信息)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                image: true,
                role: true,
                gender: true,
                studentId: true,
                school: true,
                major: true,
                grade: true,
                bio: true,
                realName: true,
                verificationStatus: true,
                personalityType: true,
                personalityTags: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                posts: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true,
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                },
                teamsCreated: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                    take: 5
                },
                teamMembers: {
                    select: {
                        team: {
                            select: {
                                id: true,
                                name: true,
                            }
                        },
                        role: true,
                    },
                    take: 10
                },
                verificationRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: {
                        posts: true,
                        teamsCreated: true,
                        teamMembers: true,
                        feedback: true,
                        reportsReceived: true,
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "用户不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error("Get user detail error:", error);
        return NextResponse.json(
            { success: false, message: "获取用户详情失败", error: error.message },
            { status: 500 }
        );
    }
}
