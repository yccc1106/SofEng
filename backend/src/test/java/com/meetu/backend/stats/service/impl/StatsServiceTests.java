package com.meetu.backend.stats.service.impl;

import com.meetu.backend.stats.mapper.StatsMapper;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class StatsServiceTests {
    @Test void usesShanghaiDayBoundariesAndRealMonthlyCounts() {
        StatsMapper mapper=mock(StatsMapper.class);
        when(mapper.posts(any(),any())).thenReturn(2L);
        var service=new StatsServiceImpl(mapper,Clock.fixed(Instant.parse("2026-10-14T02:00:00Z"),ZoneOffset.UTC));
        var result=service.dashboard();
        assertEquals(7,result.visitData().size());
        assertEquals(12,result.salesData().size());
        assertEquals("2026-10",result.salesData().get(11).x());
        assertTrue(result.salesData().stream().allMatch(point -> point.y()==2));
        verify(mapper,times(2)).activeUsers(LocalDateTime.parse("2026-10-13T16:00:00"),LocalDateTime.parse("2026-10-14T16:00:00"));
        verify(mapper).posts(LocalDateTime.parse("2026-09-30T16:00:00"),LocalDateTime.parse("2026-10-31T16:00:00"));
        assertEquals(0,result.dailyGrowth());
        assertEquals(0,result.overallProcessingRate());
    }
}
