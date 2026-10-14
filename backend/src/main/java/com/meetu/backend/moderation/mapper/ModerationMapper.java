package com.meetu.backend.moderation.mapper;
import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;
@Mapper
public interface ModerationMapper {
    @Select("<script>SELECT p.id,u.name AS author,p.title,p.content,p.status,p.\"createdAt\" AT TIME ZONE 'UTC' AS date FROM \"Post\" p JOIN \"User\" u ON u.id=p.\"authorId\" " +
            "WHERE <choose><when test='status == \"pending\"'>p.status='AUDITING'</when><when test='status == \"approved\"'>p.status='PUBLISHED'</when><when test='status == \"rejected\"'>p.status='REJECTED'</when><otherwise>p.status!='DELETED'</otherwise></choose> ORDER BY p.\"createdAt\" DESC</script>")
    List<Map<String,Object>> posts(String status);
    @Select("SELECT status FROM \"Post\" WHERE id=#{id} FOR UPDATE") String lockPost(String id);
    @Update("UPDATE \"Post\" SET status=#{status},\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status='AUDITING'")
    int decidePost(@Param("id") String id,@Param("status") String status);
    @Select("SELECT m.id,s.name AS sender,r.name AS receiver,m.content,m.\"moderationStatus\",m.\"createdAt\" AT TIME ZONE 'UTC' AS timestamp FROM \"ChatMessage\" m JOIN \"User\" s ON s.id=m.\"senderId\" LEFT JOIN \"User\" r ON r.id=m.\"receiverId\" ORDER BY m.\"createdAt\" DESC LIMIT 100")
    List<Map<String,Object>> chats();
    @Update("UPDATE \"ChatMessage\" SET \"moderationStatus\"='BLOCKED' WHERE id=#{id} AND \"moderationStatus\"='VISIBLE'") int blockChat(String id);
    @Select("SELECT t.id,t.name,u.name AS owner,t.description,t.status,(SELECT COUNT(*) FROM \"TeamMember\" m WHERE m.\"teamId\"=t.id AND m.status='JOINED') AS members FROM \"Team\" t JOIN \"User\" u ON u.id=t.\"creatorId\" ORDER BY t.\"createdAt\" DESC")
    List<Map<String,Object>> rooms();
    @Update("UPDATE \"Team\" SET status='DISBANDED',\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status!='DISBANDED'") int closeRoom(String id);
}
