import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - 获取用户列表 (P1.10 查看用户个人信息)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('current') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const status = searchParams.get('status');
        const verificationStatus = searchParams.get('verificationStatus');
        const keyword = searchParams.get('keyword');

        const where: any = {};

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

        return NextResponse.json({
            success: true,
            data: users,
            total,
            page,
            pageSize,
        });
    } catch (error: any) {
        console.error("Get users error:", error);
        return NextResponse.json(
            { success: false, message: "获取用户列表失败", error: error.message },
            { status: 500 }
        );
    }
}

// PUT - 修改用户信息/状态 (P1.11 修改/冻结/删除用户信息)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "用户ID不能为空" },
                { status: 400 }
            );
        }

        let updatedUser;

        switch (action) {
            case 'freeze':
                // 冻结用户
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'FROZEN' }
                });
                break;

            case 'unfreeze':
                // 解冻用户
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'ACTIVE' }
                });
                break;

            case 'ban':
                // 封禁用户
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'BANNED' }
                });
                break;

            case 'activate':
                // 激活用户
                updatedUser = await prisma.user.update({
                    where: { id },
                    data: { status: 'ACTIVE' }
                });
                break;

            case 'update':
                // 更新用户资料
                const allowedFields = ['name', 'email', 'school', 'major', 'grade', 'bio', 'role'];
                const filteredData: any = {};
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
                return NextResponse.json(
                    { success: false, message: "无效的操作类型" },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            message: "操作成功",
            data: updatedUser
        });
    } catch (error: any) {
        console.error("Update user error:", error);
        return NextResponse.json(
            { success: false, message: "操作失败", error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - 删除用户 (P1.11 删除用户)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: "用户ID不能为空" },
                { status: 400 }
            );
        }

        // 软删除：将用户状态设为 DELETED，而不是真正删除
        await prisma.user.update({
            where: { id },
            data: { status: 'DELETED' }
        });

        return NextResponse.json({
            success: true,
            message: "用户已删除"
        });
    } catch (error: any) {
        console.error("Delete user error:", error);
        return NextResponse.json(
            { success: false, message: "删除用户失败", error: error.message },
            { status: 500 }
        );
    }
}
