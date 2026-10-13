package com.meetu.backend.user;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepository {
    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record User(String id, String name, String email, String password, String image,
                       String role, String status, String studentId, String school, String major,
                       String grade, String bio, String gender, String personalityType,
                       String[] personalityTags, String verificationStatus) {
    }

    private static final String FIELDS = "\"id\", \"name\", \"email\", \"password\", \"image\", " +
            "CAST(\"role\" AS VARCHAR) AS \"role\", \"status\", \"studentId\", \"school\", " +
            "\"major\", \"grade\", \"bio\", CAST(\"gender\" AS VARCHAR) AS \"gender\", " +
            "\"personalityType\", \"personalityTags\", \"verificationStatus\"";

    private static User map(ResultSet rs, int row) throws SQLException {
        var tags = rs.getArray("personalityTags");
        return new User(rs.getString("id"), rs.getString("name"), rs.getString("email"),
                rs.getString("password"), rs.getString("image"), rs.getString("role"),
                rs.getString("status"), rs.getString("studentId"), rs.getString("school"),
                rs.getString("major"), rs.getString("grade"), rs.getString("bio"),
                rs.getString("gender"), rs.getString("personalityType"),
                tags == null ? new String[0] : (String[]) tags.getArray(), rs.getString("verificationStatus"));
    }

    public Optional<User> findByEmail(String email) {
        return jdbc.query("SELECT " + FIELDS + " FROM \"User\" WHERE LOWER(\"email\") = LOWER(?)", UserRepository::map, email)
                .stream().findFirst();
    }

    public Optional<User> findById(String id) {
        return jdbc.query("SELECT " + FIELDS + " FROM \"User\" WHERE \"id\" = ?", UserRepository::map, id)
                .stream().findFirst();
    }

    public User create(String name, String email, String password, String studentId, String school) {
        String id = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO \"User\" (\"id\", \"name\", \"email\", \"password\", " +
                        "\"studentId\", \"school\", \"createdAt\", \"updatedAt\", \"personalityTags\") " +
                        "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ARRAY[]::text[])",
                id, name, email, password, studentId, school);
        return findById(id).orElseThrow();
    }

    public User updateProfile(String id, String name, String school, String major, String grade, String bio) {
        jdbc.update("UPDATE \"User\" SET \"name\"=?, \"school\"=?, \"major\"=?, \"grade\"=?, " +
                        "\"bio\"=?, \"updatedAt\"=CURRENT_TIMESTAMP WHERE \"id\"=?",
                name, school, major, grade, bio, id);
        return findById(id).orElseThrow();
    }
}
