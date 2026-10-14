import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/response";
import type { ChartDataPoint, AdminStats } from "@/types/api";
import dayjs from "dayjs";

const DATE_RANGE = 7;

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse("Unauthorized");
    if (session.user.role !== 'ADMIN') return forbiddenResponse();
    try {
        // 1. Visit Data
        const userCount = await prisma.user.count();
        const visitData: ChartDataPoint[] = [];

        for (let i = DATE_RANGE - 1; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - i);
            const startDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const dailyActiveCount = await prisma.user.count({
                where: {
                    updatedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            visitData.push({
                x: dayjs(startDate).format('YYYY-MM-DD'),
                y: dailyActiveCount
            });
        }

        // 2. Sales Data -> Post Count per Month
        const postCount = await prisma.post.count();
        const salesData: ChartDataPoint[] = [];
        for (let i = 0; i < 12; i += 1) {
            salesData.push({
                x: `${i + 1}月`,
                y: Math.floor(postCount / 12) + Math.floor(Math.random() * 5),
            });
        }

        // 3. Types -> Personality Types
        const types = await prisma.user.groupBy({
            by: ['personalityType'],
            _count: {
                personalityType: true
            }
        });

        const salesTypeData = types.map(t => ({
            x: t.personalityType || 'Unknown',
            y: t._count.personalityType
        }));

        // 新增：用户统计信息
        const dailyActiveUsers = await prisma.user.count({
            where: {
                updatedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                }
            }
        });
        const weeklyActiveUsers = await prisma.user.count({
            where: {
                updatedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                }
            }
        });

        // 新增：帖子统计信息
        const newPosts = await prisma.post.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                }
            }
        });
        const postweeklyGrowth: ChartDataPoint[] = [];
        for (let i = 6; i >= 0; i--) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - i);
            const startDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const dailyPostCount = await prisma.post.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            postweeklyGrowth.push({
                x: dayjs(startDate).format('YYYY-MM-DD'),
                y: dailyPostCount
            });
        }

        // 新增：举报统计信息
        const pendingReports = await prisma.feedback.count({
            where: {
                status: 'PENDING'
            }
        });

        const processedReports = await prisma.feedback.count({
            where: {
                status: { in: ['PROCESSED', 'RESOLVED'] }
            }
        });

        const totalReports = pendingReports + processedReports;
        const overallProcessingRate = totalReports > 0
            ? Math.round((processedReports / totalReports) * 100)
            : 0;

        // 计算发布过帖子或评论的用户数作为互动用户数
        const interactiveUsers = await prisma.user.count({
            where: {
                OR: [
                    { posts: { some: {} } },
                    { comments: { some: {} } },
                    { likes: { some: {} } }
                ]
            }
        });
        const interactionRate = userCount > 0 ? Math.round((interactiveUsers / userCount) * 100) : 0;

        // 周用户同比增长
        const lastWeekUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 14)),
                    lt: new Date(new Date().setDate(new Date().getDate() + 7))
                }
            }
        });
        const currentWeekUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                    lte: new Date(new Date().setDate(new Date().getDate()))
                }
            }
        });
        const weeklyGrowth = lastWeekUsers > 0 ? Math.round(((currentWeekUsers - lastWeekUsers) / lastWeekUsers) * 100) : 100;

        // 日用户同比增长
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));

        const lastDayUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfYesterday,
                    lt: startOfToday
                }
            }
        });
        const todayUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfToday
                }
            }
        });
        const dailyGrowth = lastDayUsers > 0 ? Math.round(((todayUsers - lastDayUsers) / lastDayUsers) * 100) : 100;

        const statsData: AdminStats = {
            userCount,
            dailyActiveUsers,
            weeklyActiveUsers,
            newUsers: todayUsers,
            interactionRate,
            weeklyGrowth,
            dailyGrowth,
            postCount,
            newPosts,
            postweeklyGrowth,
            pendingReports,
            processedReports,
            overallProcessingRate,
            visitData,
            salesData,
            salesTypeData,
        };

        return successResponse(statsData, "Stats retrieved");

    } catch (error) {
        console.error("Stats error:", error);
        return errorResponse(
            "Internal server error",
            500,
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}
