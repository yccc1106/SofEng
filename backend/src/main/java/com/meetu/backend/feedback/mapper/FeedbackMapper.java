package com.meetu.backend.feedback.mapper;

import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;

@Mapper
public interface FeedbackMapper {
    String FIELDS = "f.id,f.\"userId\",f.content,f.type,f.status,f.\"reportType\",f.\"reportedUserId\",f.\"reportedPostId\",f.\"reportedMessageId\",f.contact,f.images," +
            "f.\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\",to_char((f.\"createdAt\" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Shanghai','YYYY-MM-DD') AS date,f.\"handledBy\",f.\"handledAt\" AT TIME ZONE 'UTC' AS \"handledAt\",f.\"handleNote\",u.name AS \"userName\", " +
            "ru.name AS \"targetUserName\",ru.email AS \"targetUserEmail\",ru.status AS \"targetUserStatus\",p.title AS \"targetPostTitle\",p.content AS \"targetPostContent\",p.status AS \"targetPostStatus\",m.content AS \"targetMessageContent\" " +
            "FROM \"Feedback\" f LEFT JOIN \"User\" u ON u.id=f.\"userId\" LEFT JOIN \"User\" ru ON ru.id=f.\"reportedUserId\" " +
            "LEFT JOIN \"Post\" p ON p.id=f.\"reportedPostId\" LEFT JOIN \"ChatMessage\" m ON m.id=f.\"reportedMessageId\" ";
    @Select("SELECT " + FIELDS + "WHERE f.\"userId\"=#{user} ORDER BY f.\"createdAt\" DESC")
    List<Map<String,Object>> mine(String user);
    @Select("SELECT " + FIELDS + "WHERE (CAST(#{type} AS TEXT) IS NULL OR f.type=#{type}) ORDER BY f.\"createdAt\" DESC")
    List<Map<String,Object>> all(String type);
    @Select("SELECT " + FIELDS + "WHERE f.id=#{id} FOR UPDATE OF f")
    Map<String,Object> lock(String id);
    @Select("SELECT id FROM \"User\" WHERE id=#{id} AND status='ACTIVE'") String activeUser(String id);
    @Select("SELECT id FROM \"Post\" WHERE id=#{id} AND status!='DELETED'") String activePost(String id);
    @Select("SELECT m.id FROM \"ChatMessage\" m WHERE m.id=#{id} AND m.\"moderationStatus\"='VISIBLE' AND (m.\"senderId\"=#{user} OR m.\"receiverId\"=#{user} OR " +
            "EXISTS (SELECT 1 FROM \"TeamMember\" tm WHERE tm.\"teamId\"=m.\"teamId\" AND tm.\"userId\"=#{user} AND tm.status='JOINED') OR m.\"categoryId\" IS NOT NULL)")
    String visibleMessage(@Param("id") String id,@Param("user") String user);
    @Insert("INSERT INTO \"Feedback\" (id,\"userId\",content,type,status,\"reportType\",\"reportedUserId\",\"reportedPostId\",\"reportedMessageId\",contact,images,\"createdAt\",\"updatedAt\") " +
            "VALUES (#{id},#{user},#{content},#{type},'PENDING',#{reportType},#{targetUser},#{targetPost},#{targetMessage},#{contact}," +
            "#{images,typeHandler=com.meetu.backend.post.mapper.StringArrayTypeHandler},CURRENT_TIMESTAMP AT TIME ZONE 'UTC',CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insert(@Param("id") String id,@Param("user") String user,@Param("content") String content,@Param("type") String type,
               @Param("reportType") String reportType,@Param("targetUser") String targetUser,@Param("targetPost") String targetPost,
               @Param("targetMessage") String targetMessage,@Param("contact") String contact,@Param("images") String[] images);
    @Update("UPDATE \"Feedback\" SET status=#{status},\"handledBy\"=#{admin},\"handledAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC'," +
            "\"handleNote\"=#{note},\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status='PENDING'")
    int handle(@Param("id") String id,@Param("status") String status,@Param("admin") String admin,@Param("note") String note);
    @Update("UPDATE \"User\" SET status='BANNED',\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status='ACTIVE' AND CAST(role AS VARCHAR)='USER'")
    int banUser(String id);
    @Update("UPDATE \"Post\" SET status='DELETED',\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status!='DELETED'")
    int deletePost(String id);
    @Update("UPDATE \"ChatMessage\" SET \"moderationStatus\"='BLOCKED' WHERE id=#{id} AND \"moderationStatus\"='VISIBLE'")
    int blockMessage(String id);
}
