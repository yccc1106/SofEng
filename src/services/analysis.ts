import type { AnalysisData, CategoryItem } from '@/types/analysis';

export async function fakeChartData(): Promise<AnalysisData> {
  try {
    const response = await fetch('/api/admin/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    const statsResult = await response.json();

    const categoryResponse = await fetch('/java/category');
    if (!categoryResponse.ok) {
      throw new Error('Failed to fetch categories');
    }
    const categoryResult = await categoryResponse.json();
    const categoryData: CategoryItem[] = categoryResult.data;

    // API 返回的格式是 { success, message, data }，需要提取 data 字段
    const statsData = statsResult.data || statsResult;

    // 类型安全的分类数据处理
    const sortedCategoryData: CategoryItem[] = Array.isArray(categoryData)
      ? [...categoryData]
          .sort((a, b) => b.usageCount - a.usageCount)
      : [];

    return {
      ...statsData,
      categoryData: sortedCategoryData,
    };
  } catch (error) {
    console.error("Failed to fetch chart data", error);
    return createEmptyAnalysisData();
  }
}

export function createEmptyAnalysisData(): AnalysisData {
  return {
    visitData: [],
    salesData: [],
    salesTypeData: [],
    visitData2: [],
    searchData: [],
    offlineData: [],
    offlineChartData: [],
    salesTypeDataOnline: [],
    salesTypeDataOffline: [],
    postweeklyGrowth: [],
    categoryData: [],
  };
}
