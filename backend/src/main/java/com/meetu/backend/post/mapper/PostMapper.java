package com.meetu.backend.post.mapper;

import com.meetu.backend.post.entity.CommentRow;
import com.meetu.backend.post.entity.PostRow;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.sql.Array;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Mapper
public interface PostMapper {
    String POST_SELECT = "SELECT p.id,p.title,p.content,p.images,p.tags,p.\"authorId\",p.\"viewCount\",p.status,p.\"categoryId\", " +
            "p.\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\",p.\"updatedAt\" AT TIME ZONE 'UTC' AS \"updatedAt\", " +
            "u.name AS author_name, u.image AS author_image, " +
            "u.school AS author_school, CAST(u.role AS VARCHAR) AS author_role, " +
            "(SELECT COUNT(*) FROM \"PostLike\" l WHERE l.\"postId\"=p.id) AS likes_count, " +
            "(SELECT COUNT(*) FROM \"PostCollection\" c WHERE c.\"postId\"=p.id) AS collections_count, " +
            "(SELECT COUNT(*) FROM \"PostComment\" c WHERE c.\"postId\"=p.id) AS comments_count, " +
            "EXISTS(SELECT 1 FROM \"PostLike\" l WHERE l.\"postId\"=p.id AND l.\"userId\"=#{viewerId}) AS is_liked, " +
            "EXISTS(SELECT 1 FROM \"PostCollection\" c WHERE c.\"postId\"=p.id AND c.\"userId\"=#{viewerId}) AS is_collected " +
            "FROM \"Post\" p JOIN \"User\" u ON u.id=p.\"authorId\" ";
    String COMMENT_SELECT = "SELECT c.id,c.content,c.\"userId\",c.\"postId\",c.\"createdAt\" AT TIME ZONE 'UTC' AS \"createdAt\", " +
            "c.\"updatedAt\" AT TIME ZONE 'UTC' AS \"updatedAt\",u.name AS user_name, u.image AS user_image, u.school AS user_school, " +
            "CAST(u.role AS VARCHAR) AS user_role FROM \"PostComment\" c " +
            "JOIN \"User\" u ON u.id=c.\"userId\" ";

    @Select(POST_SELECT + "WHERE p.status='PUBLISHED' AND (CAST(#{categoryId} AS TEXT) IS NULL " +
            "OR p.\"categoryId\"=#{categoryId}) ORDER BY p.\"createdAt\" DESC,p.id DESC LIMIT #{size} OFFSET #{offset}")
    List<Map<String, Object>> selectPage(@Param("viewerId") String viewerId, @Param("categoryId") String categoryId,
                                          @Param("size") int size, @Param("offset") int offset);

    @Select("SELECT COUNT(*) FROM \"Post\" p WHERE p.status='PUBLISHED' " +
            "AND (CAST(#{categoryId} AS TEXT) IS NULL OR p.\"categoryId\"=#{categoryId})")
    long count(@Param("viewerId") String viewerId, @Param("categoryId") String categoryId);

    @Select(POST_SELECT + "WHERE p.id=#{id}")
    Map<String, Object> selectById(@Param("id") String id, @Param("viewerId") String viewerId);

    @Select(POST_SELECT + "WHERE p.id=#{id} AND p.status='PUBLISHED' AND u.status='ACTIVE'")
    Map<String, Object> selectPublishedById(@Param("id") String id, @Param("viewerId") String viewerId);

    @Select(POST_SELECT + "WHERE p.status='PUBLISHED' AND u.status='ACTIVE' AND " +
            "(POSITION(LOWER(#{q}) IN LOWER(COALESCE(p.title,'')))>0 OR POSITION(LOWER(#{q}) IN LOWER(p.content))>0) " +
            "ORDER BY p.\"createdAt\" DESC LIMIT 5")
    List<Map<String,Object>> selectSearch(@Param("viewerId") String viewerId,@Param("q") String q);

    @Select("SELECT EXISTS(SELECT 1 FROM \"Category\" WHERE id=#{id})")
    boolean categoryExists(String id);

    @Insert("INSERT INTO \"Post\" (id,title,content,images,tags,\"authorId\",\"categoryId\",status,\"createdAt\",\"updatedAt\") " +
            "VALUES (#{id},#{title},#{content},#{images,typeHandler=com.meetu.backend.post.mapper.StringArrayTypeHandler}," +
            "#{tags,typeHandler=com.meetu.backend.post.mapper.StringArrayTypeHandler},#{authorId},#{categoryId}," +
            "'AUDITING',CURRENT_TIMESTAMP AT TIME ZONE 'UTC',CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insertPost(@Param("id") String id, @Param("title") String title, @Param("content") String content,
                   @Param("images") String[] images, @Param("tags") String[] tags,
                   @Param("authorId") String authorId, @Param("categoryId") String categoryId);

    @Select("SELECT status FROM \"Post\" WHERE id=#{id} FOR UPDATE")
    String lockStatus(String id);

    @Select("SELECT status FROM \"Post\" WHERE id=#{id}")
    String selectStatus(String id);

    @Delete("DELETE FROM \"PostLike\" WHERE \"userId\"=#{userId} AND \"postId\"=#{postId}")
    int deleteLike(@Param("userId") String userId, @Param("postId") String postId);
    @Insert("INSERT INTO \"PostLike\" (id,\"userId\",\"postId\",\"createdAt\") VALUES (#{id},#{userId},#{postId},CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insertLike(@Param("id") String id, @Param("userId") String userId, @Param("postId") String postId);
    @Delete("DELETE FROM \"PostCollection\" WHERE \"userId\"=#{userId} AND \"postId\"=#{postId}")
    int deleteCollection(@Param("userId") String userId, @Param("postId") String postId);
    @Insert("INSERT INTO \"PostCollection\" (id,\"userId\",\"postId\",\"createdAt\") VALUES (#{id},#{userId},#{postId},CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insertCollection(@Param("id") String id, @Param("userId") String userId, @Param("postId") String postId);

    @Select(COMMENT_SELECT + "WHERE c.\"postId\"=#{postId} ORDER BY c.\"createdAt\" ASC,c.id ASC")
    List<Map<String, Object>> selectComments(String postId);
    @Select(COMMENT_SELECT + "WHERE c.id=#{id}")
    Map<String, Object> selectComment(String id);
    @Insert("INSERT INTO \"PostComment\" (id,content,\"userId\",\"postId\",\"createdAt\",\"updatedAt\") " +
            "VALUES (#{id},#{content},#{userId},#{postId},CURRENT_TIMESTAMP AT TIME ZONE 'UTC',CURRENT_TIMESTAMP AT TIME ZONE 'UTC')")
    int insertComment(@Param("id") String id, @Param("content") String content,
                      @Param("userId") String userId, @Param("postId") String postId);

    default List<PostRow> page(String viewerId, String categoryId, int page, int size) {
        return selectPage(viewerId, categoryId, size, (page - 1) * size).stream().map(PostMapper::post).toList();
    }
    default List<PostRow> search(String viewerId,String q) { return selectSearch(viewerId,q).stream().map(PostMapper::post).toList(); }
    default Optional<PostRow> find(String id, String viewerId) {
        return Optional.ofNullable(selectById(id, viewerId)).map(PostMapper::post);
    }
    default Optional<PostRow> findPublished(String id, String viewerId) {
        return Optional.ofNullable(selectPublishedById(id, viewerId)).map(PostMapper::post);
    }
    default List<CommentRow> comments(String postId) {
        return selectComments(postId).stream().map(PostMapper::comment).toList();
    }
    default CommentRow comment(String id) { return comment(selectComment(id)); }

    private static String value(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? null : value.toString();
    }
    private static long number(Map<String, Object> row, String key) { return ((Number) row.get(key)).longValue(); }
    private static Instant instant(Map<String, Object> row, String key) {
        return ((Timestamp) row.get(key)).toInstant();
    }
    private static String[] array(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value == null) return new String[0];
        if (value instanceof String[] strings) return strings;
        try { return (String[]) ((Array) value).getArray(); }
        catch (SQLException exception) { throw new IllegalStateException("Could not read post array", exception); }
    }
    private static PostRow post(Map<String, Object> row) {
        return new PostRow(value(row,"id"),value(row,"title"),value(row,"content"),array(row,"images"),
                array(row,"tags"),value(row,"authorId"),value(row,"categoryId"),
                (int) number(row,"viewCount"),value(row,"status"),instant(row,"createdAt"),instant(row,"updatedAt"),
                value(row,"author_name"),value(row,"author_image"),value(row,"author_school"),value(row,"author_role"),
                number(row,"likes_count"),number(row,"collections_count"),number(row,"comments_count"),
                Boolean.TRUE.equals(row.get("is_liked")),Boolean.TRUE.equals(row.get("is_collected")));
    }
    private static CommentRow comment(Map<String, Object> row) {
        return new CommentRow(value(row,"id"),value(row,"content"),value(row,"userId"),value(row,"postId"),
                instant(row,"createdAt"),instant(row,"updatedAt"),value(row,"user_name"),
                value(row,"user_image"),value(row,"user_school"),value(row,"user_role"));
    }
}
