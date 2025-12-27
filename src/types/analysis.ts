export interface DataItem {
  [field: string]: string | number | number[] | null | undefined;
}
export interface VisitDataType {
  x: string;
  y: number;
}

export type SearchDataType = {
  index: number;
  keyword: string;
  count: number;
  range: number;
  status: number;
};

export type OfflineDataType = {
  name: string;
  cvr: number;
};

export interface OfflineChartData {
  date: number;
  type: number;
  value: number;
}

export type RadarData = {
  name: string;
  label: string;
  value: number;
};

export interface AnalysisData {
    visitData: DataItem[];
    salesData: DataItem[];
    salesTypeData: DataItem[];
    visitData2: DataItem[];
    searchData: DataItem[];
    offlineData: OfflineDataType[];
    offlineChartData: DataItem[];
    salesTypeDataOnline: DataItem[];
    salesTypeDataOffline: DataItem[];
    // 添加数据库统计字段
    userCount?: number;
    dailyActiveUsers?: number;
    weeklyActiveUsers?: number;
    newPosts?: number;
    pendingReports?: number;
    processedReports?: number;
    newUsers?: number;
    interactionRate?: number;
    weeklyGrowth?: number;
    dailyGrowth?: number;
    todayUsers?: number;
    postweeklyGrowth?: DataItem[];
    overallProcessingRate?: number;
    categoryData?: { name: string; usageCount: number }[];

}
