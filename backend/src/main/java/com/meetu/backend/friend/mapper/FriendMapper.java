package com.meetu.backend.friend.mapper;

import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;

@Mapper
public interface FriendMapper {
    @Select("SELECT id FROM \"User\" WHERE id=#{id} AND status='ACTIVE' FOR UPDATE")
    String lockActiveUser(String id);

    @Select("SELECT u.id,u.name,u.image,u.school,CAST(u.role AS varchar) AS role FROM \"Friendship\" f " +
            "JOIN \"User\" u ON u.id=CASE WHEN f.\"userAId\"=#{id} THEN f.\"userBId\" ELSE f.\"userAId\" END " +
            "WHERE (f.\"userAId\"=#{id} OR f.\"userBId\"=#{id}) AND f.status='FRIEND' AND u.status='ACTIVE' ORDER BY f.\"createdAt\" DESC")
    List<Map<String,Object>> friends(String id);

    @Select("SELECT id,\"senderId\",\"receiverId\",status,message,\"createdAt\",\"updatedAt\" FROM \"FriendRequest\" " +
            "WHERE #{id} IN (\"senderId\",\"receiverId\") AND status='PENDING' AND " +
            "((\"senderId\"=#{a} AND \"receiverId\"=#{b}) OR (\"senderId\"=#{b} AND \"receiverId\"=#{a})) LIMIT 1")
    Map<String,Object> pending(@Param("id") String id, @Param("a") String a, @Param("b") String b);

    @Select("SELECT id FROM \"Friendship\" WHERE status='FRIEND' AND " +
            "((\"userAId\"=#{a} AND \"userBId\"=#{b}) OR (\"userAId\"=#{b} AND \"userBId\"=#{a})) LIMIT 1")
    String existingFriendship(@Param("a") String a, @Param("b") String b);

    @Insert("INSERT INTO \"FriendRequest\" (id,\"senderId\",\"receiverId\",status,message,\"createdAt\",\"updatedAt\") " +
            "VALUES (#{id},#{sender},#{receiver},'PENDING',#{message},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
    int insertRequest(@Param("id") String id, @Param("sender") String sender, @Param("receiver") String receiver,
                      @Param("message") String message);

    @Select("SELECT r.id,r.\"senderId\",r.\"receiverId\",r.status,r.message,r.\"createdAt\",r.\"updatedAt\", " +
            "u.id AS \"personId\",u.name AS \"personName\",u.image AS \"personImage\",u.school AS \"personSchool\" " +
            "FROM \"FriendRequest\" r JOIN \"User\" u ON u.id=CASE WHEN #{type}='sent' THEN r.\"receiverId\" ELSE r.\"senderId\" END " +
            "WHERE ((#{type}='sent' AND r.\"senderId\"=#{id}) OR (#{type}='received' AND r.\"receiverId\"=#{id} AND r.status='PENDING')) " +
            "ORDER BY r.\"createdAt\" DESC")
    List<Map<String,Object>> requests(@Param("id") String id, @Param("type") String type);

    @Select("SELECT id,\"senderId\",\"receiverId\",status,message,\"createdAt\",\"updatedAt\" FROM \"FriendRequest\" WHERE id=#{id}")
    Map<String,Object> request(String id);

    @Update("UPDATE \"FriendRequest\" SET status=#{status},\"updatedAt\"=CURRENT_TIMESTAMP WHERE id=#{id} AND status='PENDING'")
    int decide(@Param("id") String id, @Param("status") String status);

    @Insert("INSERT INTO \"Friendship\" (id,\"userAId\",\"userBId\",status,\"createdAt\") VALUES (#{id},#{a},#{b},'FRIEND',CURRENT_TIMESTAMP)")
    int insertFriendship(@Param("id") String id, @Param("a") String a, @Param("b") String b);

    @Update("UPDATE \"FriendRequest\" SET status='REJECTED',\"updatedAt\"=CURRENT_TIMESTAMP WHERE status='PENDING' " +
            "AND ((\"senderId\"=#{a} AND \"receiverId\"=#{b}) OR (\"senderId\"=#{b} AND \"receiverId\"=#{a}))")
    int closeOtherPending(@Param("a") String a, @Param("b") String b);
}
