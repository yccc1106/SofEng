package com.meetu.backend.admin.mapper;
import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;
@Mapper
public interface ManagementMapper {
    String USER_FIELDS="u.id,u.name,u.email,u.\"phoneNumber\",u.image,CAST(u.role AS VARCHAR) AS role,CAST(u.gender AS VARCHAR) AS gender,u.\"studentId\",u.school,u.major,u.grade,u.bio,u.\"realName\",u.\"verificationStatus\",u.status,u.\"personalityType\",u.\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\",u.\"updatedAt\" AT TIME ZONE 'UTC' AS \"updatedAt\",(SELECT COUNT(*) FROM \"Post\" p WHERE p.\"authorId\"=u.id) AS posts,(SELECT COUNT(*) FROM \"Team\" t WHERE t.\"creatorId\"=u.id) AS teams,(SELECT COUNT(*) FROM \"TeamMember\" tm WHERE tm.\"userId\"=u.id) AS memberships,(SELECT COUNT(*) FROM \"Feedback\" f WHERE f.\"userId\"=u.id) AS \"feedbackCount\",(SELECT COUNT(*) FROM \"Feedback\" f WHERE f.\"reportedUserId\"=u.id) AS \"reportsReceived\" ";
    String FILTER="FROM \"User\" u WHERE (CAST(#{status} AS TEXT) IS NULL OR u.status=#{status}) AND (CAST(#{verification} AS TEXT) IS NULL OR u.\"verificationStatus\"=#{verification}) AND (CAST(#{keyword} AS TEXT) IS NULL OR LOWER(COALESCE(u.name,'') || ' ' || COALESCE(u.email,'') || ' ' || COALESCE(u.\"studentId\",'') || ' ' || COALESCE(u.school,'')) LIKE '%' || LOWER(#{keyword}) || '%') ";
    @Select("SELECT "+USER_FIELDS+FILTER+"ORDER BY u.\"createdAt\" DESC LIMIT #{size} OFFSET #{offset}")
    List<Map<String,Object>> users(@Param("status") String status,@Param("verification") String verification,@Param("keyword") String keyword,@Param("size") int size,@Param("offset") int offset);
    @Select("SELECT COUNT(*) "+FILTER) long userCount(@Param("status") String status,@Param("verification") String verification,@Param("keyword") String keyword);
    @Select("SELECT "+USER_FIELDS+"FROM \"User\" u WHERE u.id=#{id}") Map<String,Object> user(String id);
    @Select("SELECT id,title,status,\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\" FROM \"Post\" WHERE \"authorId\"=#{id} ORDER BY \"createdAt\" DESC LIMIT 10") List<Map<String,Object>> userPosts(String id);
    @Select("SELECT id,name,status FROM \"Team\" WHERE \"creatorId\"=#{id} ORDER BY \"createdAt\" DESC LIMIT 5") List<Map<String,Object>> userTeams(String id);
    @Select("SELECT tm.role,t.id AS \"teamId\",t.name AS \"teamName\" FROM \"TeamMember\" tm JOIN \"Team\" t ON t.id=tm.\"teamId\" WHERE tm.\"userId\"=#{id} ORDER BY tm.\"joinedAt\" DESC LIMIT 10") List<Map<String,Object>> userMemberships(String id);
    @Select("SELECT id,\"userId\",\"realName\",\"studentId\",school,major,grade,documents,status,\"reviewedAt\" AT TIME ZONE 'UTC' AS \"reviewedAt\",\"reviewedBy\",\"reviewNote\",\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\" FROM \"VerificationRequest\" WHERE \"userId\"=#{id} ORDER BY \"createdAt\" DESC LIMIT 5") List<Map<String,Object>> userVerifications(String id);
    @Select("SELECT id,status,CAST(role AS VARCHAR) AS role FROM \"User\" WHERE id=#{id} FOR UPDATE") Map<String,Object> lockUser(String id);
    @Update("UPDATE \"User\" SET status=#{status},\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id}") int userStatus(@Param("id") String id,@Param("status") String status);
    @Select("SELECT id FROM \"User\" WHERE LOWER(email)=LOWER(#{email}) AND id!=#{id}") String duplicateEmail(@Param("email") String email,@Param("id") String id);
    @Update("<script>UPDATE \"User\" <set>" +
            "<if test='name != null'>name=#{name},</if><if test='email != null'>email=#{email},</if>" +
            "<if test='school != null'>school=#{school},</if><if test='major != null'>major=#{major},</if>" +
            "<if test='grade != null'>grade=#{grade},</if><if test='bio != null'>bio=#{bio},</if>" +
            "<if test='role != null'>role=CAST(#{role} AS \"Role\"),</if>\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC'" +
            "</set> WHERE id=#{id}</script>")
    int updateUser(@Param("id") String id,@Param("name") String name,@Param("email") String email,
                   @Param("school") String school,@Param("major") String major,@Param("grade") String grade,
                   @Param("bio") String bio,@Param("role") String role);
    @Select("<script>SELECT v.id,v.\"userId\",v.\"realName\",v.\"studentId\",v.school,v.major,v.grade,v.documents,v.status,v.\"reviewedAt\" AT TIME ZONE 'UTC' AS \"reviewedAt\",v.\"reviewedBy\",v.\"reviewNote\",v.\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\",u.name AS \"userName\",u.email AS \"userEmail\",u.image AS \"userImage\",u.\"verificationStatus\" AS \"userVerificationStatus\" FROM \"VerificationRequest\" v JOIN \"User\" u ON u.id=v.\"userId\" <if test='status != null and status != \"all\"'>WHERE v.status=#{status}</if> ORDER BY v.\"createdAt\" DESC LIMIT #{size} OFFSET #{offset}</script>")
    List<Map<String,Object>> verifications(@Param("status") String status,@Param("size") int size,@Param("offset") int offset);
    @Select("SELECT COUNT(*) FROM \"VerificationRequest\" WHERE CAST(#{status} AS TEXT)='all' OR status=#{status}") long verificationCount(String status);
    @Select("SELECT id,\"userId\",status,\"realName\",\"studentId\",school,major,grade FROM \"VerificationRequest\" WHERE id=#{id} FOR UPDATE") Map<String,Object> lockVerification(String id);
    @Update("UPDATE \"VerificationRequest\" SET status=#{status},\"reviewedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC',\"reviewedBy\"=#{admin},\"reviewNote\"=#{note},\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status='PENDING'")
    int decideVerification(@Param("id") String id,@Param("status") String status,@Param("admin") String admin,@Param("note") String note);
    @Update("UPDATE \"User\" SET \"verificationStatus\"=#{status},\"realName\"=#{realName},\"studentId\"=#{studentId},school=#{school},major=#{major},grade=#{grade},\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id}")
    int approveUser(@Param("id") String id,@Param("status") String status,@Param("realName") String realName,@Param("studentId") String studentId,@Param("school") String school,@Param("major") String major,@Param("grade") String grade);
    @Update("UPDATE \"User\" SET \"verificationStatus\"='REJECTED',\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id}") int rejectUser(String id);
    @Select("SELECT c.id,c.name,c.\"parentId\",p.name AS parent,c.description,c.\"usageCount\" AS count FROM \"Category\" c LEFT JOIN \"Category\" p ON p.id=c.\"parentId\" ORDER BY c.\"usageCount\" DESC") List<Map<String,Object>> categories();
    @Select("SELECT id,name,\"parentId\",description,\"usageCount\",\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\",\"updatedAt\" AT TIME ZONE 'UTC' AS \"updatedAt\" FROM \"Category\" WHERE id=#{id}") Map<String,Object> categoryDetail(String id);
    @Select("SELECT id,\"parentId\" FROM \"Category\" WHERE id=#{id}") Map<String,Object> category(String id);
    @Select("SELECT id FROM \"Category\" WHERE name=#{name} AND id!=#{id}") String duplicateCategory(@Param("name") String name,@Param("id") String id);
    @Insert("INSERT INTO \"Category\" (id,name,\"parentId\",description,\"createdAt\",\"updatedAt\") VALUES (#{id},#{name},#{parent},#{description},CURRENT_TIMESTAMP AT TIME ZONE 'UTC',CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insertCategory(@Param("id") String id,@Param("name") String name,@Param("parent") String parent,@Param("description") String description);
    @Update("UPDATE \"Category\" SET name=#{name},\"parentId\"=#{parent},description=#{description},\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id}")
    int updateCategory(@Param("id") String id,@Param("name") String name,@Param("parent") String parent,@Param("description") String description);
    @Select("SELECT COUNT(*) FROM \"Category\" WHERE \"parentId\"=#{id}") long childCount(String id);
    @Select("SELECT (SELECT COUNT(*) FROM \"Post\" WHERE \"categoryId\"=#{id})+(SELECT COUNT(*) FROM \"Team\" WHERE \"categoryId\"=#{id})+(SELECT COUNT(*) FROM \"ChatMessage\" WHERE \"categoryId\"=#{id})") long referenceCount(String id);
    @Delete("DELETE FROM \"Category\" WHERE id=#{id}") int deleteCategory(String id);
}
