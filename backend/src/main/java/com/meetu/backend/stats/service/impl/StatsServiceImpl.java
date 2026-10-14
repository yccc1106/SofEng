package com.meetu.backend.stats.service.impl;

import com.meetu.backend.stats.dto.StatsDtos;
import com.meetu.backend.stats.mapper.StatsMapper;
import com.meetu.backend.stats.service.StatsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/** 以真实业务记录计算管理统计，并使用上海自然日作为统计窗口。 */
@Service
public class StatsServiceImpl implements StatsService {
    private static final ZoneId SHANGHAI=ZoneId.of("Asia/Shanghai");
    private final StatsMapper mapper;
    private final Clock clock;
    @org.springframework.beans.factory.annotation.Autowired
    public StatsServiceImpl(StatsMapper mapper) { this(mapper,Clock.systemUTC()); }
    StatsServiceImpl(StatsMapper mapper,Clock clock) { this.mapper=mapper; this.clock=clock; }
    // 数据库存 UTC，查询前把上海自然日边界换算成 UTC 时间。
    private static LocalDateTime utc(LocalDate day) { return LocalDateTime.ofInstant(day.atStartOfDay(SHANGHAI).toInstant(),ZoneOffset.UTC); }
    private static int rate(long value,long total) { return total==0 ? 0 : (int)Math.round(value*100.0/total); }
    private static int growth(long current,long previous) { return previous==0 ? 0 : (int)Math.round((current-previous)*100.0/previous); }

    /** 在同一只读快照中读取指标，避免图表与汇总值来自不同数据状态。 */
    @Override @Transactional(readOnly=true, isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ) public StatsDtos.Dashboard dashboard() {
        LocalDate today=LocalDate.now(clock.withZone(SHANGHAI));
        LocalDateTime start=utc(today),end=utc(today.plusDays(1));
        long users=mapper.userCount(),active=mapper.activeUsers(start,end),weeklyActive=mapper.activeUsers(utc(today.minusDays(6)),end);
        long newUsers=mapper.newUsers(start,end),posts=mapper.postCount(),newPosts=mapper.posts(start,end);
        long pending=mapper.pendingReports(),processed=mapper.processedReports();
        List<StatsDtos.Point> visits=new ArrayList<>(),postWeek=new ArrayList<>(),months=new ArrayList<>(),types=new ArrayList<>();
        for(int i=6;i>=0;i--) {
            LocalDate day=today.minusDays(i);
            visits.add(new StatsDtos.Point(day.toString(),mapper.activeUsers(utc(day),utc(day.plusDays(1)))));
            postWeek.add(new StatsDtos.Point(day.toString(),mapper.posts(utc(day),utc(day.plusDays(1)))));
        }
        LocalDate month=today.withDayOfMonth(1);
        for(int i=11;i>=0;i--) {
            LocalDate first=month.minusMonths(i);
            months.add(new StatsDtos.Point(first.format(DateTimeFormatter.ofPattern("yyyy-MM")),mapper.posts(utc(first),utc(first.plusMonths(1)))));
        }
        mapper.personalityTypes().forEach(row -> types.add(new StatsDtos.Point((String)row.get("type"),((Number)row.get("amount")).longValue())));
        long lastWeek=mapper.newUsers(utc(today.minusDays(13)),utc(today.minusDays(6)));
        long currentWeek=mapper.newUsers(utc(today.minusDays(6)),end);
        long yesterday=mapper.newUsers(utc(today.minusDays(1)),start);
        return new StatsDtos.Dashboard(users,active,weeklyActive,newUsers,posts,newPosts,pending,processed,
                rate(weeklyActive,users),rate(processed,pending+processed),growth(currentWeek,lastWeek),growth(newUsers,yesterday),
                visits,postWeek,months,types);
    }
}
