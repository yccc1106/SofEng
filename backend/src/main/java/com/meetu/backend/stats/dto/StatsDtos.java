package com.meetu.backend.stats.dto;
import java.util.List;
public final class StatsDtos {
    private StatsDtos() {}
    public record Point(String x,long y) {}
    public record Dashboard(long userCount,long dailyActiveUsers,long weeklyActiveUsers,long newUsers,
                            long postCount,long newPosts,long pendingReports,long processedReports,
                            int interactionRate,int overallProcessingRate,int weeklyGrowth,int dailyGrowth,
                            List<Point> visitData,List<Point> postweeklyGrowth,List<Point> salesData,List<Point> salesTypeData) {}
}
