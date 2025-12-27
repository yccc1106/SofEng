import {AnalysisData} from "@/types/analysis";

export async function fakeChartData(): Promise<AnalysisData> {
    try {
        const [statsResponse, categoryResponse] = await Promise.all([
            fetch('/api/admin/stats'),
            fetch('/api/category')
        ]);

        if (!statsResponse.ok) {
            throw new Error(`Stats API failed: ${statsResponse.status} ${statsResponse.statusText}`);
        }
        if (!categoryResponse.ok) {
            throw new Error(`Category API failed: ${categoryResponse.status} ${categoryResponse.statusText}`);
        }

        const statsResult = await statsResponse.json();
        const categoryData = await categoryResponse.json();

        // 修复：正确提取 API 返回的 data 属性
        const statsData = statsResult.data || statsResult;

        return {
            ...statsData,  // 展开 statsData 中的所有属性
            categoryData: Array.isArray(categoryData)
                ? categoryData.sort((a: any, b: any) => (b.usageCount || 0) - (a.usageCount || 0))
                : []
        };
    } catch (error) {
        console.error("Failed to fetch chart data", error);

        // 返回符合 AnalysisData 类型的默认值
        return {
            userCount: 0,
            visitData: [],
            visitData2: [],
            salesData: [],
            searchData: [],
            offlineData: [],
            offlineChartData: [],
            salesTypeData: [],
            salesTypeDataOnline: [],
            salesTypeDataOffline: [],
            dailyActiveUsers: 0,
            weeklyActiveUsers: 0,
            newPosts: 0,
            pendingReports: 0,
            processedReports: 0,
            newUsers: 0,
            interactionRate: 0,
            weeklyGrowth: 0,
            dailyGrowth: 0,
            todayUsers: 0,
            postweeklyGrowth: [],
            overallProcessingRate: 0,
            categoryData: []
        };
    }
}
