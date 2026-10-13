package com.meetu.backend.post.service.impl;

import com.meetu.backend.post.dto.PostDtos;
import com.meetu.backend.post.mapper.PostMapper;
import com.meetu.backend.post.service.PostService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PostServiceImpl implements PostService {
    private final PostMapper posts;

    public PostServiceImpl(PostMapper posts) { this.posts = posts; }

    @Override
    public Page list(String viewerId, String categoryId, int page, int pageSize) {
        if (page < 1 || pageSize < 1 || pageSize > 100 || page > Integer.MAX_VALUE / pageSize)
            throw new InvalidPostRequestException("Invalid pagination");
        if (categoryId != null && !posts.categoryExists(categoryId))
            throw new InvalidPostRequestException("Category not found");
        long total = posts.count(viewerId, categoryId);
        return new Page(posts.page(viewerId, categoryId, page, pageSize).stream().map(PostDtos.Post::from).toList(),
                page, pageSize, total);
    }

    @Override
    @Transactional
    public PostDtos.Post create(String userId, PostDtos.CreatePost request) {
        if (request.content().isBlank()) throw new InvalidPostRequestException("Content is required");
        if (request.images() != null && request.images().size() > 10 ||
                request.tags() != null && request.tags().size() > 10)
            throw new InvalidPostRequestException("Too many images or tags");
        if (request.categoryId() != null && !posts.categoryExists(request.categoryId()))
            throw new InvalidPostRequestException("Category not found");
        String id = UUID.randomUUID().toString();
        posts.insertPost(id, request.title() == null || request.title().isBlank() ? null : request.title().trim(),
                request.content().trim(), request.images() == null ? new String[0] : request.images().toArray(String[]::new),
                request.tags() == null ? new String[0] : request.tags().toArray(String[]::new), userId, request.categoryId());
        return PostDtos.Post.from(posts.find(id, userId).orElseThrow());
    }

    @Override
    public List<PostDtos.Comment> comments(String postId) {
        requirePublished(postId, false);
        return posts.comments(postId).stream().map(PostDtos.Comment::from).toList();
    }

    @Override
    @Transactional
    public PostDtos.Comment comment(String userId, String postId, PostDtos.CreateComment request) {
        requirePublished(postId, true);
        if (request.content().isBlank()) throw new InvalidPostRequestException("Content is required");
        String id = UUID.randomUUID().toString();
        posts.insertComment(id, request.content().trim(), userId, postId);
        return PostDtos.Comment.from(posts.comment(id));
    }

    @Override
    @Transactional
    public boolean toggleLike(String userId, String postId) {
        requirePublished(postId, true);
        if (posts.deleteLike(userId, postId) > 0) return false;
        posts.insertLike(UUID.randomUUID().toString(), userId, postId);
        return true;
    }

    @Override
    @Transactional
    public boolean toggleCollection(String userId, String postId) {
        requirePublished(postId, true);
        if (posts.deleteCollection(userId, postId) > 0) return false;
        posts.insertCollection(UUID.randomUUID().toString(), userId, postId);
        return true;
    }

    private void requirePublished(String id, boolean lock) {
        String status = lock ? posts.lockStatus(id) : posts.selectStatus(id);
        if (!"PUBLISHED".equals(status)) throw new PostNotFoundException();
    }

    public static class InvalidPostRequestException extends RuntimeException {
        public InvalidPostRequestException(String message) { super(message); }
    }
    public static class PostNotFoundException extends RuntimeException {}
}
