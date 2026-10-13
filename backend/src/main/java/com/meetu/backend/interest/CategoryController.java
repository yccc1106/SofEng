package com.meetu.backend.interest;

import com.meetu.backend.common.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/category")
public class CategoryController {
    private final JdbcTemplate jdbc;

    public CategoryController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Category(String id, String name, String parentId, String description, int usageCount) {}

    @GetMapping
    public ApiResponse<List<Category>> list() {
        return ApiResponse.success("Categories retrieved", jdbc.query(
                "SELECT id, name, \"parentId\", description, \"usageCount\" FROM \"Category\" " +
                        "ORDER BY \"usageCount\" DESC, name ASC",
                (rs, row) -> new Category(rs.getString("id"), rs.getString("name"), rs.getString("parentId"),
                        rs.getString("description"), rs.getInt("usageCount"))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable String id) {
        var categories = jdbc.query("SELECT id, name, \"parentId\", description, \"usageCount\" " +
                        "FROM \"Category\" WHERE id = ?",
                (rs, row) -> new Category(rs.getString("id"), rs.getString("name"), rs.getString("parentId"),
                        rs.getString("description"), rs.getInt("usageCount")), id);
        if (categories.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("Category not found"));
        }
        return ResponseEntity.ok(ApiResponse.success("Category retrieved", categories.get(0)));
    }
}
