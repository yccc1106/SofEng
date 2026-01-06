import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/response";
import type { Prisma } from "@prisma/client";

// GET - 获取待审核的学信网认证请求列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('current') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const status = searchParams.get('status') || 'PENDING';

        const where: Prisma.VerificationRequestWhereInput = {};
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

        return paginatedResponse(requests, page, pageSize, total);
    } catch (error) {
        console.error("Get verification requests error:", error);
        return errorResponse(
            "获取认证请求列表失败",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// PUT - 审核学信网认证请求
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, reviewNote, adminId } = body;

        if (!id || !action) {
            return errorResponse("缺少必要参数", 400);
        }

        // 获取认证请求
        const verificationRequest = await prisma.verificationRequest.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!verificationRequest) {
            return errorResponse("认证请求不存在", 404);
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
                return errorResponse("无效的操作类型", 400);
        }

        // 使用事务更新认证请求和用户状态
        const result = await prisma.$transaction([
            prisma.verificationRequest.update({
                where: { id },
                data: {
                    status: newStatus,
                    reviewedAt: new Date(),
                    reviewedBy: adminId || 'admin',
                    reviewNote: reviewNote || null,
                }
            }),
            prisma.user.update({
                where: { id: verificationRequest.userId },
                data: {
                    verificationStatus: userVerificationStatus,
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

        return successResponse(result[0], action === 'approve' ? '认证已通过' : '认证已拒绝');
    } catch (error) {
        console.error("Review verification error:", error);
        return errorResponse(
            "审核失败",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
