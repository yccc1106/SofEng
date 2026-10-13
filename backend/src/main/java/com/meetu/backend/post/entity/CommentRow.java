package com.meetu.backend.post.entity;

import java.time.Instant;

public record CommentRow(String id, String content, String userId, String postId,
                         Instant createdAt, Instant updatedAt, String userName, String userImage,
                         String userSchool, String userRole) {}
