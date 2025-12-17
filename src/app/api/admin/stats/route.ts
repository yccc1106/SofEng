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
        const visitData: any[] = [];
        const beginDay = Date.now();
        for (let i = 0; i < 7; i += 1) {
            visitData.push({
                x: dayjs(new Date(beginDay - 1000 * 60 * 60 * 24 * (6 - i))).format('YYYY-MM-DD'),
                y: Math.floor(userCount * (0.1 + Math.random() * 0.1) * 10), // Mock daily visits based on user base
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

        // Reuse structure for consistency
        return NextResponse.json({
            data: {
                visitData,
                visitData2: visitData,
                salesData, // Posts volume
                searchData: [],
                offlineData: [],
                offlineChartData: [],
                salesTypeData, // Personality distribution
                salesTypeDataOnline: [],
                salesTypeDataOffline: [],
                radarData: []
            }
        });

    } catch (error: any) {
        return NextResponse.json(formatResponse(false, "Internal server error", error.message), { status: 500 });
    }
}
