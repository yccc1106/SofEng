
import type { AnalysisData } from '@/types/analysis';

export async function fakeChartData(): Promise<AnalysisData> {
    try {
        const response = await fetch('/api/admin/stats');
        const statsData = await response.json();

        const categoryResponse = await fetch('/api/category');
        const categoryData = await categoryResponse.json();

        return {
            ...statsData,
            categoryData: categoryData.sort((a: any, b: any) => b.usageCount - a.usageCount)
        };
    } catch (error) {
        console.error("Failed to fetch chart data", error);
        return { } as AnalysisData;
    }
}
