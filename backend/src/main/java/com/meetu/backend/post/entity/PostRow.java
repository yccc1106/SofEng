package com.meetu.backend.post.entity;

import java.time.Instant;

public record PostRow(String id, String title, String content, String[] images, String[] tags,
                      String authorId, String categoryId, int viewCount, String status,
                      Instant createdAt, Instant updatedAt, String authorName, String authorImage,
                      String authorSchool, String authorRole, long likesCount, long collectionsCount,
                      long commentsCount, boolean isLiked, boolean isCollected) {}
