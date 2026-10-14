package com.meetu.backend.stats.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface StatsMapper {
    @Select("SELECT COUNT(*) FROM \"User\" WHERE status='ACTIVE' AND CAST(role AS varchar)='USER'") long userCount();
    @Select("SELECT COUNT(*) FROM \"User\" WHERE status='ACTIVE' AND CAST(role AS varchar)='USER' AND \"createdAt\">=#{start} AND \"createdAt\"<#{end}")
    long newUsers(@Param("start") LocalDateTime start,@Param("end") LocalDateTime end);
    @Select("SELECT COUNT(*) FROM \"Post\" WHERE status<>'DELETED'") long postCount();
    @Select("SELECT COUNT(*) FROM \"Post\" WHERE status<>'DELETED' AND \"createdAt\">=#{start} AND \"createdAt\"<#{end}")
    long posts(@Param("start") LocalDateTime start,@Param("end") LocalDateTime end);
    @Select("SELECT COUNT(*) FROM \"Feedback\" WHERE type='REPORT' AND status='PENDING'") long pendingReports();
    @Select("SELECT COUNT(*) FROM \"Feedback\" WHERE type='REPORT' AND status IN ('PROCESSED','RESOLVED','IGNORED')") long processedReports();
    // Activity means a distinct active ordinary user who created a post, comment, like or message in the half-open UTC window.
    @Select("SELECT COUNT(*) FROM (SELECT DISTINCT actor FROM ("+
            "SELECT \"authorId\" AS actor FROM \"Post\" WHERE \"createdAt\">=#{start} AND \"createdAt\"<#{end} UNION ALL "+
            "SELECT \"userId\" AS actor FROM \"PostComment\" WHERE \"createdAt\">=#{start} AND \"createdAt\"<#{end} UNION ALL "+
            "SELECT \"userId\" AS actor FROM \"PostLike\" WHERE \"createdAt\">=#{start} AND \"createdAt\"<#{end} UNION ALL "+
            "SELECT \"senderId\" AS actor FROM \"ChatMessage\" WHERE \"createdAt\">=#{start} AND \"createdAt\"<#{end}"+
            ") e) a JOIN \"User\" u ON u.id=a.actor WHERE u.status='ACTIVE' AND CAST(u.role AS varchar)='USER'")
    long activeUsers(@Param("start") LocalDateTime start,@Param("end") LocalDateTime end);
    @Select("SELECT \"personalityType\" AS type, COUNT(*) AS amount FROM \"User\" WHERE status='ACTIVE' AND CAST(role AS varchar)='USER' AND \"personalityType\" IS NOT NULL GROUP BY \"personalityType\" ORDER BY amount DESC,type")
    List<Map<String,Object>> personalityTypes();
}
