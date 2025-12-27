
import type { AnalysisData } from '@/types/analysis';

export async function fakeChartData(): Promise<AnalysisData> {
    try {
        const response = await fetch('/api/admin/stats');
        const statsResult = await response.json();

        const categoryResponse = await fetch('/api/category');
        const categoryData = await categoryResponse.json();

        // API 返回的格式是 { data: {...} }，需要提取 data 字段
        const statsData = statsResult.data || statsResult;

        return {
            ...statsData,
            categoryData: categoryData.sort((a: any, b: any) => b.usageCount - a.usageCount)
        };
    } catch (error) {
        console.error("Failed to fetch chart data", error);
        return {} as AnalysisData;
    }
}
