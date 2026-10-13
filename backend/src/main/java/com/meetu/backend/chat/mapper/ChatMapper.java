package com.meetu.backend.chat.mapper;

import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;

@Mapper
public interface ChatMapper {
    String MESSAGE_SELECT = "SELECT m.id,m.content,m.type,m.\"senderId\",m.\"receiverId\",m.\"teamId\",m.\"categoryId\",m.\"isRead\",m.\"createdAt\", " +
            "u.id AS \"senderUserId\",u.name AS \"senderName\",u.image AS \"senderImage\" FROM \"ChatMessage\" m " +
            "JOIN \"User\" u ON u.id=m.\"senderId\" ";
    String BEFORE = "<if test='beforeTime != null'> AND (m.\"createdAt\",m.id) &lt; (#{beforeTime},#{beforeId})</if> ";
    String AFTER = "ORDER BY m.\"createdAt\" DESC,m.id DESC LIMIT 100";

    @Select("SELECT id,\"createdAt\",\"senderId\",\"receiverId\",\"teamId\",\"categoryId\" FROM \"ChatMessage\" WHERE id=#{id}")
    Map<String,Object> cursor(String id);
    @Select("<script>" + MESSAGE_SELECT + "WHERE ((m.\"senderId\"=#{viewer} AND m.\"receiverId\"=#{other}) OR " +
            "(m.\"senderId\"=#{other} AND m.\"receiverId\"=#{viewer})) " + BEFORE + AFTER + "</script>")
    List<Map<String,Object>> direct(@Param("viewer") String viewer,@Param("other") String other,
                                     @Param("beforeTime") Object beforeTime,@Param("beforeId") String beforeId);
    @Select("<script>" + MESSAGE_SELECT + "WHERE m.\"teamId\"=#{id} " + BEFORE + AFTER + "</script>")
    List<Map<String,Object>> team(@Param("id") String id,@Param("beforeTime") Object beforeTime,@Param("beforeId") String beforeId);
    @Select("<script>" + MESSAGE_SELECT + "WHERE m.\"categoryId\"=#{id} " + BEFORE + AFTER + "</script>")
    List<Map<String,Object>> category(@Param("id") String id,@Param("beforeTime") Object beforeTime,@Param("beforeId") String beforeId);

    @Select("SELECT id FROM \"Friendship\" WHERE status='FRIEND' AND " +
            "((\"userAId\"=#{a} AND \"userBId\"=#{b}) OR (\"userAId\"=#{b} AND \"userBId\"=#{a})) LIMIT 1")
    String friendship(@Param("a") String a,@Param("b") String b);
    @Select("SELECT id FROM \"User\" WHERE id=#{id} AND status='ACTIVE'") String activeUser(String id);
    @Select("SELECT id FROM \"Team\" WHERE id=#{id} AND status!='DISBANDED'") String activeTeam(String id);
    @Select("SELECT id FROM \"TeamMember\" WHERE \"teamId\"=#{teamId} AND \"userId\"=#{userId} AND status='JOINED'")
    String joined(@Param("teamId") String teamId,@Param("userId") String userId);
    @Select("SELECT id FROM \"Category\" WHERE id=#{id}") String categoryExists(String id);

    @Insert("INSERT INTO \"ChatMessage\" (id,content,type,\"senderId\",\"receiverId\",\"teamId\",\"categoryId\",\"isRead\",\"createdAt\") " +
            "VALUES (#{id},#{content},'TEXT',#{sender},#{receiver},#{team},#{category},false,CURRENT_TIMESTAMP)")
    int insert(@Param("id") String id,@Param("content") String content,@Param("sender") String sender,
               @Param("receiver") String receiver,@Param("team") String team,@Param("category") String category);
    @Select(MESSAGE_SELECT + "WHERE m.id=#{id}") Map<String,Object> message(String id);
    @Select("SELECT u.id,u.name,u.image,CAST('USER' AS TEXT) AS type,CAST(NULL AS TEXT) AS \"subType\" FROM \"Friendship\" f " +
            "JOIN \"User\" u ON u.id=CASE WHEN f.\"userAId\"=#{id} THEN f.\"userBId\" ELSE f.\"userAId\" END " +
            "WHERE f.status='FRIEND' AND (f.\"userAId\"=#{id} OR f.\"userBId\"=#{id}) AND u.status='ACTIVE' " +
            "UNION ALL SELECT t.id,t.name,CAST(NULL AS TEXT),CAST('TEAM' AS TEXT),t.type FROM \"TeamMember\" tm " +
            "JOIN \"Team\" t ON t.id=tm.\"teamId\" WHERE tm.\"userId\"=#{id} AND tm.status='JOINED' AND t.status!='DISBANDED' ORDER BY name")
    List<Map<String,Object>> contacts(String id);
    @Select("<script>SELECT COUNT(*) FROM \"ChatMessage\" m LEFT JOIN \"ChatReadCursor\" c ON c.\"userId\"=#{viewer} " +
            "AND c.\"scopeType\"=#{scope} AND c.\"scopeId\"=#{id} WHERE m.\"senderId\"&lt;&gt;#{viewer} " +
            "AND m.\"createdAt\" &gt; COALESCE(c.\"lastReadAt\",TIMESTAMP '1970-01-01') " +
            "<choose><when test='scope == \"USER\"'>AND m.\"senderId\"=#{id} AND m.\"receiverId\"=#{viewer}</when>" +
            "<when test='scope == \"TEAM\"'>AND m.\"teamId\"=#{id}</when>" +
            "<otherwise>AND m.\"categoryId\"=#{id}</otherwise></choose></script>")
    long unread(@Param("viewer") String viewer,@Param("scope") String scope,@Param("id") String id);
    @Insert("INSERT INTO \"ChatReadCursor\" (\"userId\",\"scopeType\",\"scopeId\",\"lastReadAt\") " +
            "VALUES (#{viewer},#{scope},#{id},CURRENT_TIMESTAMP) ON CONFLICT (\"userId\",\"scopeType\",\"scopeId\") " +
            "DO UPDATE SET \"lastReadAt\"=GREATEST(\"ChatReadCursor\".\"lastReadAt\",EXCLUDED.\"lastReadAt\")")
    int upsertRead(@Param("viewer") String viewer,@Param("scope") String scope,@Param("id") String id);
    @Update("UPDATE \"ChatMessage\" SET \"isRead\"=true WHERE \"senderId\"=#{other} AND \"receiverId\"=#{viewer} AND \"isRead\"=false")
    int markDirectRead(@Param("viewer") String viewer,@Param("other") String other);
}
