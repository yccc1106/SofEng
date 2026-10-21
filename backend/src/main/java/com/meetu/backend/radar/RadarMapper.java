package com.meetu.backend.radar;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface RadarMapper {
    String INTERESTS = """
            SELECT DISTINCT cid FROM (
              SELECT p."categoryId" AS cid FROM "Post" p
                WHERE p."authorId"=#{viewer} AND p."categoryId" IS NOT NULL
              UNION
              SELECT t."categoryId" AS cid FROM "Team" t
                WHERE t."creatorId"=#{viewer} AND t."categoryId" IS NOT NULL
              UNION
              SELECT t."categoryId" AS cid FROM "TeamMember" tm
                JOIN "Team" t ON t.id=tm."teamId"
                WHERE tm."userId"=#{viewer} AND tm.status='JOINED' AND t."categoryId" IS NOT NULL
            ) x WHERE cid IS NOT NULL
            """;

    @Select(INTERESTS)
    List<String> viewerInterestIds(@Param("viewer") String viewer);

    @Select("""
            SELECT u.id,u.name,u.image,u.school,u.major,u.grade,u.bio,
                   u."personalityType",u."personalityTags",
                   ARRAY(
                     SELECT DISTINCT x.cid FROM (
                       SELECT p."categoryId" AS cid FROM "Post" p
                         WHERE p."authorId"=u.id AND p."categoryId" IS NOT NULL
                       UNION
                       SELECT t."categoryId" AS cid FROM "Team" t
                         WHERE t."creatorId"=u.id AND t."categoryId" IS NOT NULL
                       UNION
                       SELECT t."categoryId" AS cid FROM "TeamMember" tm
                         JOIN "Team" t ON t.id=tm."teamId"
                         WHERE tm."userId"=u.id AND tm.status='JOINED' AND t."categoryId" IS NOT NULL
                     ) x
                   ) AS "interestIds",
                   (
                     (SELECT COUNT(*) FROM "Post" p WHERE p."authorId"=u.id) +
                     (SELECT COUNT(*) FROM "Team" t WHERE t."creatorId"=u.id) +
                     (SELECT COUNT(*) FROM "TeamMember" tm WHERE tm."userId"=u.id AND tm.status='JOINED')
                   )::int AS "activityCount"
            FROM "User" u
            WHERE u.status='ACTIVE' AND CAST(u.role AS varchar)='USER'
              AND u.id<>#{viewer} AND u."personalityType" IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM "Friendship" f
                WHERE (f."userAId"=#{viewer} AND f."userBId"=u.id)
                   OR (f."userBId"=#{viewer} AND f."userAId"=u.id)
              )
              AND NOT EXISTS (
                SELECT 1 FROM "FriendRequest" r
                WHERE r.status='PENDING'
                  AND ((r."senderId"=#{viewer} AND r."receiverId"=u.id)
                    OR (r."receiverId"=#{viewer} AND r."senderId"=u.id))
              )
            ORDER BY u.id
            """)
    List<Map<String, Object>> candidates(@Param("viewer") String viewer);

    @Select("SELECT id,name FROM \"Category\"")
    List<Map<String, Object>> categories();
}
