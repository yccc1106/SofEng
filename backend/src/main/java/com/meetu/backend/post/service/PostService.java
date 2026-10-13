package com.meetu.backend.post.service;

import com.meetu.backend.post.dto.PostDtos;

import java.util.List;

public interface PostService {
    record Page(List<PostDtos.Post> posts, int page, int pageSize, long total) {}
    Page list(String viewerId, String categoryId, int page, int pageSize);
    PostDtos.Post create(String userId, PostDtos.CreatePost request);
    List<PostDtos.Comment> comments(String postId);
    PostDtos.Comment comment(String userId, String postId, PostDtos.CreateComment request);
    boolean toggleLike(String userId, String postId);
    boolean toggleCollection(String userId, String postId);
}
