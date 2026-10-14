package com.meetu.backend.interest.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.interest.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/category")
public class CategoryController {
    private final CategoryService categories;

    public CategoryController(CategoryService categories) { this.categories = categories; }

    @GetMapping
    public ApiResponse<?> list() { return ApiResponse.success("Categories retrieved", categories.list()); }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable String id) {
        return categories.get(id).<ResponseEntity<ApiResponse<?>>>map(category ->
                        ResponseEntity.ok(ApiResponse.success("Category retrieved", category)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Category not found")));
    }
}
