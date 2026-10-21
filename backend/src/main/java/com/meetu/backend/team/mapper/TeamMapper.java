package com.meetu.backend.team.mapper;

import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;

/** 队伍和成员的 SQL 映射；容量统计仅计算已加入成员。 */
@Mapper
public interface TeamMapper {
    String TEAM_SELECT = "SELECT t.id,t.name,t.description,t.image,t.type,t.\"maxMembers\",t.status,t.\"requiresApproval\",t.\"creatorId\",t.\"categoryId\", " +
            "t.\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\", " +
            "u.id AS \"creatorUserId\",u.name AS \"creatorName\",u.image AS \"creatorImage\",u.school AS \"creatorSchool\", " +
            "(SELECT COUNT(*) FROM \"TeamMember\" m WHERE m.\"teamId\"=t.id AND m.status='JOINED') AS \"joinedCount\" " +
            "FROM \"Team\" t JOIN \"User\" u ON u.id=t.\"creatorId\" ";
    @Select(TEAM_SELECT + "WHERE (#{mine}=true AND EXISTS (SELECT 1 FROM \"TeamMember\" m WHERE m.\"teamId\"=t.id AND m.\"userId\"=#{viewer} AND m.status='JOINED')) " +
            "OR (#{mine}=false AND t.status='RECRUITING' AND (CAST(#{type} AS TEXT) IS NULL OR t.type=#{type}) AND (CAST(#{categoryId} AS TEXT) IS NULL OR t.\"categoryId\"=#{categoryId})) " +
            "ORDER BY t.\"createdAt\" DESC")
    List<Map<String,Object>> list(@Param("viewer") String viewer,@Param("mine") boolean mine,@Param("type") String type,@Param("categoryId") String categoryId);
    @Select(TEAM_SELECT + "WHERE t.id=#{id}") Map<String,Object> team(String id);
    @Select(TEAM_SELECT + "WHERE t.status='RECRUITING' AND u.status='ACTIVE' AND " +
            "(POSITION(LOWER(#{q}) IN LOWER(t.name))>0 OR POSITION(LOWER(#{q}) IN LOWER(COALESCE(t.description,'')))>0) " +
            "ORDER BY t.\"createdAt\" DESC LIMIT 5")
    List<Map<String,Object>> search(String q);
    // 加入和审批都锁同一队伍行，使容量检查串行执行。
    @Select("SELECT id,\"creatorId\",status,\"maxMembers\",\"requiresApproval\" FROM \"Team\" WHERE id=#{id} FOR UPDATE")
    Map<String,Object> lockTeam(String id);
    @Select("SELECT id FROM \"Category\" WHERE id=#{id}") String category(String id);
    @Insert("INSERT INTO \"Team\" (id,name,description,image,type,\"maxMembers\",status,\"requiresApproval\",\"creatorId\",\"categoryId\",\"createdAt\",\"updatedAt\") " +
            "VALUES (#{id},#{name},#{description},#{image},#{type},#{maxMembers},'RECRUITING',#{approval},#{creator},#{categoryId}," +
            "CURRENT_TIMESTAMP AT TIME ZONE 'UTC',CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insertTeam(@Param("id") String id,@Param("name") String name,@Param("description") String description,
                   @Param("type") String type,@Param("maxMembers") int maxMembers,@Param("approval") boolean approval,
                   @Param("creator") String creator,@Param("categoryId") String categoryId,@Param("image") String image);
    @Select("SELECT COUNT(*) FROM \"TeamMember\" WHERE \"teamId\"=#{teamId} AND status='JOINED'")
    long joinedCount(String teamId);
    @Select("SELECT id,\"teamId\",\"userId\",role,status,\"joinMessage\",\"joinedAt\" AT TIME ZONE 'UTC' AS \"joinedAt\" " +
            "FROM \"TeamMember\" WHERE \"teamId\"=#{teamId} AND \"userId\"=#{userId}")
    Map<String,Object> memberForUser(@Param("teamId") String teamId,@Param("userId") String userId);
    @Select("SELECT id,\"teamId\",\"userId\",role,status,\"joinMessage\",\"joinedAt\" AT TIME ZONE 'UTC' AS \"joinedAt\" " +
            "FROM \"TeamMember\" WHERE id=#{id}")
    Map<String,Object> member(String id);
    @Insert("INSERT INTO \"TeamMember\" (id,\"teamId\",\"userId\",role,status,\"joinMessage\",\"joinedAt\") " +
            "VALUES (#{id},#{teamId},#{userId},#{role},#{status},#{message},CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insertMember(@Param("id") String id,@Param("teamId") String teamId,@Param("userId") String userId,
                     @Param("role") String role,@Param("status") String status,@Param("message") String message);
    @Update("UPDATE \"TeamMember\" SET status=#{status},\"joinMessage\"=#{message},\"joinedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status='REJECTED'")
    int reapply(@Param("id") String id,@Param("status") String status,@Param("message") String message);
    @Update("UPDATE \"TeamMember\" SET status=#{status} WHERE id=#{id} AND status='PENDING'")
    int decide(@Param("id") String id,@Param("status") String status);
    @Update("UPDATE \"Team\" SET status='FULL',\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status='RECRUITING'")
    int markFull(String id);
    @Select("SELECT m.id,m.\"teamId\",m.\"userId\",m.role,m.status,m.\"joinMessage\", " +
            "m.\"joinedAt\" AT TIME ZONE 'UTC' AS \"joinedAt\", " +
            "u.name AS \"userName\",u.image AS \"userImage\",u.school AS \"userSchool\", " +
            "t.name AS \"teamName\" FROM \"TeamMember\" m JOIN \"Team\" t ON t.id=m.\"teamId\" JOIN \"User\" u ON u.id=m.\"userId\" " +
            "WHERE t.\"creatorId\"=#{creatorId} AND m.status='PENDING' ORDER BY m.\"joinedAt\" DESC")
    List<Map<String,Object>> pending(String creatorId);
    @Select("SELECT id FROM \"User\" WHERE id=#{id} AND status='ACTIVE'") String activeUser(String id);
}
