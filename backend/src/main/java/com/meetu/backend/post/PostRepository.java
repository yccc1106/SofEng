package com.meetu.backend.post;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PostRepository {
    private final JdbcTemplate jdbc;

    public PostRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record Author(String id, String name, String image, String school, String role) {}
    public record Counts(long likes, long collections, long comments) {}
    public record Post(String id, String title, String content, String[] images, String[] tags,
                       String authorId, String categoryId, int viewCount, String status,
                       Instant createdAt, Instant updatedAt, Author author, Counts _count,
                       boolean isLiked, boolean isCollected) {}
    public record Comment(String id, String content, String userId, String postId,
                          Instant createdAt, Instant updatedAt, Author user) {}

    private static final String POST_SELECT = "SELECT p.*, u.name AS author_name, u.image AS author_image, " +
            "u.school AS author_school, CAST(u.role AS VARCHAR) AS author_role, " +
            "(SELECT COUNT(*) FROM \"PostLike\" l WHERE l.\"postId\"=p.id) AS likes_count, " +
            "(SELECT COUNT(*) FROM \"PostCollection\" c WHERE c.\"postId\"=p.id) AS collections_count, " +
            "(SELECT COUNT(*) FROM \"PostComment\" c WHERE c.\"postId\"=p.id) AS comments_count, " +
            "EXISTS(SELECT 1 FROM \"PostLike\" l WHERE l.\"postId\"=p.id AND l.\"userId\"=?) AS is_liked, " +
            "EXISTS(SELECT 1 FROM \"PostCollection\" c WHERE c.\"postId\"=p.id AND c.\"userId\"=?) AS is_collected " +
            "FROM \"Post\" p JOIN \"User\" u ON u.id=p.\"authorId\" ";

    private static String[] array(ResultSet rs, String name) throws SQLException {
        var value = rs.getArray(name);
        return value == null ? new String[0] : (String[]) value.getArray();
    }

    private static Post mapPost(ResultSet rs, int row) throws SQLException {
        return new Post(rs.getString("id"), rs.getString("title"), rs.getString("content"),
                array(rs, "images"), array(rs, "tags"), rs.getString("authorId"),
                rs.getString("categoryId"), rs.getInt("viewCount"), rs.getString("status"),
                rs.getTimestamp("createdAt").toInstant(), rs.getTimestamp("updatedAt").toInstant(),
                new Author(rs.getString("authorId"), rs.getString("author_name"),
                        rs.getString("author_image"), rs.getString("author_school"), rs.getString("author_role")),
                new Counts(rs.getLong("likes_count"), rs.getLong("collections_count"), rs.getLong("comments_count")),
                rs.getBoolean("is_liked"), rs.getBoolean("is_collected"));
    }

    public List<Post> list(String viewerId, String categoryId, int page, int pageSize) {
        return jdbc.query(POST_SELECT + "WHERE (p.status='PUBLISHED' OR (p.status IN ('AUDITING','REJECTED') AND p.\"authorId\"=?)) " +
                        "AND (CAST(? AS TEXT) IS NULL OR p.\"categoryId\"=?) ORDER BY p.\"createdAt\" DESC, p.id DESC LIMIT ? OFFSET ?",
                PostRepository::mapPost, viewerId, viewerId, viewerId, categoryId, categoryId, pageSize,
                (page - 1) * pageSize);
    }

    public long count(String viewerId, String categoryId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM \"Post\" p WHERE " +
                        "(p.status='PUBLISHED' OR (p.status IN ('AUDITING','REJECTED') AND p.\"authorId\"=?)) " +
                        "AND (CAST(? AS TEXT) IS NULL OR p.\"categoryId\"=?)", Long.class, viewerId, categoryId, categoryId);
    }

    public Optional<Post> find(String id, String viewerId) {
        return jdbc.query(POST_SELECT + "WHERE p.id=?", PostRepository::mapPost,
                viewerId, viewerId, id).stream().findFirst();
    }

    public boolean categoryExists(String id) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM \"Category\" WHERE id=?)",
                Boolean.class, id));
    }

    public String create(String title, String content, String[] images, String[] tags, String authorId, String categoryId) {
        String id = UUID.randomUUID().toString();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("INSERT INTO \"Post\" (id, title, content, images, tags, " +
                    "\"authorId\", \"categoryId\", status, \"createdAt\", \"updatedAt\") " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, 'AUDITING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            statement.setString(1, id);
            statement.setString(2, title);
            statement.setString(3, content);
            statement.setArray(4, connection.createArrayOf("text", images));
            statement.setArray(5, connection.createArrayOf("text", tags));
            statement.setString(6, authorId);
            statement.setString(7, categoryId);
            return statement;
        });
        return id;
    }

    public Optional<String> lockStatus(String id) {
        return jdbc.query("SELECT status FROM \"Post\" WHERE id=? FOR UPDATE", (rs, row) -> rs.getString(1), id)
                .stream().findFirst();
    }

    public boolean toggle(String table, String userId, String postId) {
        if (!table.equals("PostLike") && !table.equals("PostCollection")) throw new IllegalArgumentException();
        String sqlTable = "\"" + table + "\"";
        int deleted = jdbc.update("DELETE FROM " + sqlTable + " WHERE \"userId\"=? AND \"postId\"=?", userId, postId);
        if (deleted > 0) return false;
        jdbc.update("INSERT INTO " + sqlTable + " (id, \"userId\", \"postId\", \"createdAt\") " +
                "VALUES (?, ?, ?, CURRENT_TIMESTAMP)", UUID.randomUUID().toString(), userId, postId);
        return true;
    }

    public List<Comment> comments(String postId) {
        return jdbc.query("SELECT c.*, u.name AS user_name, u.image AS user_image, u.school AS user_school, " +
                        "CAST(u.role AS VARCHAR) AS user_role FROM \"PostComment\" c " +
                        "JOIN \"User\" u ON u.id=c.\"userId\" WHERE c.\"postId\"=? " +
                        "ORDER BY c.\"createdAt\" ASC, c.id ASC",
                PostRepository::mapComment, postId);
    }

    private static Comment mapComment(ResultSet rs, int row) throws SQLException {
        return new Comment(rs.getString("id"), rs.getString("content"), rs.getString("userId"),
                rs.getString("postId"), rs.getTimestamp("createdAt").toInstant(),
                rs.getTimestamp("updatedAt").toInstant(),
                new Author(rs.getString("userId"), rs.getString("user_name"), rs.getString("user_image"),
                        rs.getString("user_school"), rs.getString("user_role")));
    }

    public Comment addComment(String postId, String userId, String content) {
        String id = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO \"PostComment\" (id, content, \"userId\", \"postId\", \"createdAt\", \"updatedAt\") " +
                "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)", id, content, userId, postId);
        return jdbc.query("SELECT c.*, u.name AS user_name, u.image AS user_image, u.school AS user_school, " +
                        "CAST(u.role AS VARCHAR) AS user_role FROM \"PostComment\" c " +
                        "JOIN \"User\" u ON u.id=c.\"userId\" WHERE c.id=?",
                PostRepository::mapComment, id).get(0);
    }
}
