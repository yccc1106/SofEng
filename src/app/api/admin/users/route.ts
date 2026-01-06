import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

// GET - 获取用户列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('current') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const status = searchParams.get('status');
        const verificationStatus = searchParams.get('verificationStatus');
        const keyword = searchParams.get('keyword');

        const where: Prisma.UserWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (verificationStatus) {
            where.verificationStatus = verificationStatus;
        }

        if (keyword) {
            where.OR = [
                { name: { contains: keyword, mode: 'insensitive' } },
                { email: { contains: keyword, mode: 'insensitive' } },
                { studentId: { contains: keyword, mode: 'insensitive' } },
                { school: { contains: keyword, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
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
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            posts: true,
                            teamsCreated: true,
                            teamMembers: true,
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        return paginatedResponse(users, page, pageSize, total);

    } catch (error) {
        console.error("Get users error:", error);
        return errorResponse(
            "获取用户列表失败",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// PUT - 修改用户信息/状态
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, ...updateData } = body;

        if (!id) {
            return errorResponse("用户ID不能为空", 400);
        }

        let updatedUser;

        switch (action) {
            case 'freeze':
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'FROZEN' }
                });
                break;

            case 'unfreeze':
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'ACTIVE' }
                });
                break;

            case 'ban':
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'BANNED' }
                });
                break;

            case 'activate':
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'ACTIVE' }
                });
                break;

            case 'update':
                const allowedFields = ['name', 'email', 'school', 'major', 'grade', 'bio', 'role'];
                const filteredData: Record<string, unknown> = {};
                for (const key of allowedFields) {
                    if (updateData[key] !== undefined) {
                        filteredData[key] = updateData[key];
                    }
                }
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: filteredData
                });
                break;

            default:
                return errorResponse("无效的操作类型", 400);
        }

        return successResponse(updatedUser, "操作成功");

    } catch (error) {
        console.error("Update user error:", error);
        return errorResponse(
            "操作失败",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// DELETE - 删除用户
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return errorResponse("用户ID不能为空", 400);
        }

        await prisma.user.update({
            where: { id },
            data: { status: 'DELETED' }
        });

        return successResponse(null, "用户已删除");

    } catch (error) {
        console.error("Delete user error:", error);
        return errorResponse(
            "删除用户失败",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
