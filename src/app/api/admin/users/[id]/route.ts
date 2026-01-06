import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";

// GET - 获取单个用户详细信息
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
            return errorResponse("用户不存在", 404);
        }

        return successResponse(user, "User detail retrieved");
    } catch (error) {
        console.error("Get user detail error:", error);
        return errorResponse(
            "获取用户详情失败",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
