import { javaRequest } from '@/lib/java-client';

export type Point = { x: string; y: number };
export type DashboardStats = {
  userCount: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  newUsers: number;
  postCount: number;
  newPosts: number;
  pendingReports: number;
  processedReports: number;
  interactionRate: number;
  overallProcessingRate: number;
  weeklyGrowth: number;
  dailyGrowth: number;
  visitData: Point[];
  postweeklyGrowth: Point[];
  salesData: Point[];
  salesTypeData: Point[];
};

export function loadDashboardStats(): Promise<DashboardStats> {
  return javaRequest<DashboardStats>('/admin/stats');
}
