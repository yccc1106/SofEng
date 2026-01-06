export interface DataItem {
  [field: string]: string | number | number[] | null | undefined;
}

export interface VisitDataType {
  x: string;
  y: number;
  [key: string]: string | number | undefined;
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
  [key: string]: number | undefined;
}

export type RadarData = {
  name: string;
  label: string;
  value: number;
};

// 分类数据类型
export interface CategoryItem {
  id: string;
  name: string;
  usageCount: number;
  parentId: string | null;
  description: string | null;
  [key: string]: unknown;
}

export interface AnalysisData {
  visitData: VisitDataType[];
  salesData: VisitDataType[];
  salesTypeData: VisitDataType[];
  visitData2: VisitDataType[];
  searchData: SearchDataType[];
  offlineData: OfflineDataType[];
  offlineChartData: OfflineChartData[];
  salesTypeDataOnline: VisitDataType[];
  salesTypeDataOffline: VisitDataType[];
  postweeklyGrowth?: VisitDataType[];
  categoryData?: CategoryItem[];

  // 数据库统计字段
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
  overallProcessingRate?: number;
}
