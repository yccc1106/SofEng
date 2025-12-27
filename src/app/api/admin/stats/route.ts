import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/utils";
import dayjs from "dayjs";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    // const session = await auth();
    // if (!session?.user) return NextResponse.json(formatResponse(false, "Unauthorized"), { status: 401 });

    try {
        // 1. Visit Data (Mocked but dynamic based on User count to show scale)
        const userCount = await prisma.user.count();
        // 使用用户更新时间作为活跃指标
        const visitData: any[] = [];
        const dateRange = 7;

        for (let i = dateRange - 1; i >= 0; i--) {
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


        // 2. Sales Data -> Post Count per Month (Mock distribution for demo year)
        const postCount = await prisma.post.count();
        const salesData: any[] = [];
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
                    gte: new Date(new Date().setHours(0, 0, 0, 0)), // 今天
                }
            }
        });
        const weeklyActiveUsers = await prisma.user.count({
            where: {
                updatedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 一周内
                }
            }
        });

        // 新增：帖子统计信息
        const newPosts = await prisma.post.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)), // 今天
                }
            }
        });
        const postweeklyGrowth: any[] = [];
        for (let i = 6; i >= 0; i--) {  // 从6到0，确保日期顺序正确
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
                // 移除时间限制，统计所有已处理的报告
            }
        });

        // 计算整体处理率
        const totalReports = pendingReports + processedReports;
        const overallProcessingRate = totalReports > 0
            ? Math.round((processedReports / totalReports) * 100)
            : 0;




        // 计算发布过帖子或评论的用户数作为互动用户数
        const interactiveUsers = await prisma.user.count({
            where: {
                OR: [
                    { posts: { some: {} } },      // 发布过帖子的用户
                    { comments: { some: {} } },   // 发表过评论的用户
                    { likes: { some: {} } }       // 点过赞的用户
                ]
            }
        });
        const interactionRate = userCount > 0 ? Math.round((interactiveUsers / userCount) * 100) : 0;

        // 周用户同比增长
        const lastWeekUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 14)), // 14天前
                    lt: new Date(new Date().setDate(new Date().getDate() + 7))    // 7天前
                }
            }
        });
        const currentWeekUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7)), // 7天前
                    lte: new Date(new Date().setDate(new Date().getDate()))      // 今天
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

        // Reuse structure for consistency
        return NextResponse.json({
            data: {
                userCount,
                visitData,
                visitData2: visitData,
                salesData, // Posts volume
                searchData: [],
                offlineData: [],
                offlineChartData: [],
                salesTypeData, // Personality distribution
                salesTypeDataOnline: [],
                salesTypeDataOffline: [],
                radarData: [],
                // 新增统计字段
                dailyActiveUsers,
                weeklyActiveUsers,
                newPosts,
                pendingReports,
                processedReports,
                newUsers: todayUsers, // 今日新增用户数
                interactionRate,
                weeklyGrowth,
                dailyGrowth,
                todayUsers,
                postweeklyGrowth,
                overallProcessingRate,
            }
        });

    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}
