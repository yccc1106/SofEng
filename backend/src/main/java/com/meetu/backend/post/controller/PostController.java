package com.meetu.backend.post.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.post.dto.PostDtos;
import com.meetu.backend.post.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostService posts;

    public PostController(PostService posts) { this.posts = posts; }

    @GetMapping
    public ApiResponse<?> list(@RequestParam(defaultValue = "1") int page,
                               @RequestParam(required = false) Integer pageSize,
                               @RequestParam(required = false) Integer limit,
                               @RequestParam(required = false) String categoryId,
                               Authentication authentication) {
        int size = pageSize != null ? pageSize : limit != null ? limit : 10;
        var result = posts.list(viewer(authentication), categoryId, page, size);
        return ApiResponse.page("Posts retrieved", result.posts(), result.page(), result.pageSize(), result.total());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PostDtos.Post>> create(@Valid @RequestBody PostDtos.CreatePost request,
                                                              Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Post submitted for review",
                posts.create(authentication.getName(), request)));
    }

    @GetMapping("/{id}/comments")
    public ApiResponse<?> comments(@PathVariable String id) {
        return ApiResponse.success("Comments retrieved", posts.comments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<PostDtos.Comment>> comment(@PathVariable String id,
            @Valid @RequestBody PostDtos.CreateComment request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comment created",
                posts.comment(authentication.getName(), id, request)));
    }

    @PostMapping("/{id}/like")
    public ApiResponse<Void> like(@PathVariable String id, Authentication authentication) {
        return ApiResponse.success(posts.toggleLike(authentication.getName(), id) ? "Liked" : "Unliked", null);
    }

    @PostMapping("/{id}/collect")
    public ApiResponse<Void> collect(@PathVariable String id, Authentication authentication) {
        return ApiResponse.success(posts.toggleCollection(authentication.getName(), id) ? "Collected" : "Uncollected", null);
    }

    private static String viewer(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof String principal)
                || "anonymousUser".equals(principal)) return null;
        return authentication.getName();
    }
}
