import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - 获取待审核的学信网认证请求列表 (P1.12 学信网认证人工审核)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('current') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const status = searchParams.get('status') || 'PENDING';

        const where: any = {};
        if (status !== 'all') {
            where.status = status;
        }

        const [requests, total] = await Promise.all([
            prisma.verificationRequest.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            verificationStatus: true,
                        }
                    }
                }
            }),
            prisma.verificationRequest.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            data: requests,
            total,
            page,
            pageSize,
        });
    } catch (error: any) {
        console.error("Get verification requests error:", error);
        return NextResponse.json(
            { success: false, message: "获取认证请求列表失败", error: error.message },
            { status: 500 }
        );
    }
}

// PUT - 审核学信网认证请求 (P1.12 学信网认证人工审核)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, reviewNote, adminId } = body;

        if (!id || !action) {
            return NextResponse.json(
                { success: false, message: "缺少必要参数" },
                { status: 400 }
            );
        }

        // 获取认证请求
        const verificationRequest = await prisma.verificationRequest.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!verificationRequest) {
            return NextResponse.json(
                { success: false, message: "认证请求不存在" },
                { status: 404 }
            );
        }

        let newStatus: string;
        let userVerificationStatus: string;

        switch (action) {
            case 'approve':
                newStatus = 'APPROVED';
                userVerificationStatus = 'VERIFIED';
                break;
            case 'reject':
                newStatus = 'REJECTED';
                userVerificationStatus = 'REJECTED';
                break;
            default:
                return NextResponse.json(
                    { success: false, message: "无效的操作类型" },
                    { status: 400 }
                );
        }

        // 使用事务更新认证请求和用户状态
        const result = await prisma.$transaction([
            // 更新认证请求状态
            prisma.verificationRequest.update({
                where: { id },
                data: {
                    status: newStatus,
                    reviewedAt: new Date(),
                    reviewedBy: adminId || 'admin',
                    reviewNote: reviewNote || null,
                }
            }),
            // 更新用户认证状态和信息
            prisma.user.update({
                where: { id: verificationRequest.userId },
                data: {
                    verificationStatus: userVerificationStatus,
                    // 如果通过认证，更新用户的学信息
                    ...(action === 'approve' ? {
                        realName: verificationRequest.realName,
                        studentId: verificationRequest.studentId,
                        school: verificationRequest.school,
                        major: verificationRequest.major,
                        grade: verificationRequest.grade,
                    } : {})
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            message: action === 'approve' ? '认证已通过' : '认证已拒绝',
            data: result[0]
        });
    } catch (error: any) {
        console.error("Review verification error:", error);
        return NextResponse.json(
            { success: false, message: "审核失败", error: error.message },
            { status: 500 }
        );
    }
}
