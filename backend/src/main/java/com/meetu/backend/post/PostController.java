package com.meetu.backend.post;

import com.meetu.backend.common.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostRepository posts;

    public PostController(PostRepository posts) { this.posts = posts; }

    public record CreatePost(@Size(max = 100) String title, @NotBlank @Size(max = 10000) String content,
                             List<@NotBlank @Size(max = 2048) String> images,
                             List<@NotBlank @Size(max = 50) String> tags, String categoryId) {}
    public record CreateComment(@NotBlank @Size(max = 2000) String content) {}

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam(defaultValue = "1") int page,
                                                @RequestParam(required = false) Integer pageSize,
                                                @RequestParam(required = false) Integer limit,
                                                @RequestParam(required = false) String categoryId,
                                                Authentication authentication) {
        int size = pageSize != null ? pageSize : limit != null ? limit : 10;
        if (page < 1 || size < 1 || size > 100 || page > Integer.MAX_VALUE / size) return bad("Invalid pagination");
        if (categoryId != null && !posts.categoryExists(categoryId)) return bad("Category not found");
        String viewer = viewer(authentication);
        long total = posts.count(viewer, categoryId);
        return ResponseEntity.ok(ApiResponse.page("Posts retrieved", posts.list(viewer, categoryId, page, size),
                page, size, total));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody CreatePost request, Authentication authentication) {
        if (request.images() != null && request.images().size() > 10 ||
                request.tags() != null && request.tags().size() > 10) return bad("Too many images or tags");
        if (request.content().isBlank()) return bad("Content is required");
        if (request.categoryId() != null && !posts.categoryExists(request.categoryId())) return bad("Category not found");
        String id = posts.create(trimOptional(request.title()), request.content().trim(),
                request.images() == null ? new String[0] : request.images().toArray(String[]::new),
                request.tags() == null ? new String[0] : request.tags().toArray(String[]::new),
                authentication.getName(), request.categoryId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Post submitted for review",
                posts.find(id, authentication.getName()).orElseThrow()));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<?>> comments(@PathVariable String id) {
        var post = posts.find(id, null);
        if (post.isEmpty() || !"PUBLISHED".equals(post.get().status())) return missing();
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved", posts.comments(id)));
    }

    @PostMapping("/{id}/comments")
    @Transactional
    public ResponseEntity<ApiResponse<?>> comment(@PathVariable String id, @Valid @RequestBody CreateComment request,
                                                   Authentication authentication) {
        var status = posts.lockStatus(id);
        if (status.isEmpty() || !"PUBLISHED".equals(status.get())) return missing();
        if (request.content().isBlank()) return bad("Content is required");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comment created",
                posts.addComment(id, authentication.getName(), request.content().trim())));
    }

    @PostMapping("/{id}/like")
    @Transactional
    public ResponseEntity<ApiResponse<?>> like(@PathVariable String id, Authentication authentication) {
        return toggle(id, authentication, "PostLike", "Liked", "Unliked");
    }

    @PostMapping("/{id}/collect")
    @Transactional
    public ResponseEntity<ApiResponse<?>> collect(@PathVariable String id, Authentication authentication) {
        return toggle(id, authentication, "PostCollection", "Collected", "Uncollected");
    }

    private ResponseEntity<ApiResponse<?>> toggle(String id, Authentication authentication,
                                                  String table, String added, String removed) {
        var status = posts.lockStatus(id);
        if (status.isEmpty() || !"PUBLISHED".equals(status.get())) return missing();
        boolean active = posts.toggle(table, authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(active ? added : removed, null));
    }

    private static String viewer(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof String principal)
                || "anonymousUser".equals(principal)) return null;
        return authentication.getName();
    }

    private static String trimOptional(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    private static ResponseEntity<ApiResponse<?>> bad(String message) {
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    private static ResponseEntity<ApiResponse<?>> missing() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Post not found"));
    }
}
