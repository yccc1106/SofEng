package com.meetu.backend.post.dto;

import com.meetu.backend.post.entity.PostRow;
import com.meetu.backend.post.entity.CommentRow;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class PostDtos {
    private PostDtos() {}

    public record CreatePost(@Size(max = 100) String title, @NotBlank @Size(max = 10000) String content,
                             List<@NotBlank @Size(max = 2048) String> images,
                             List<@NotBlank @Size(max = 50) String> tags, String categoryId) {}
    public record CreateComment(@NotBlank @Size(max = 2000) String content) {}
    public record Author(String id, String name, String image, String school, String role) {}
    public record Counts(long likes, long collections, long comments) {}
    public record Post(String id, String title, String content, String[] images, String[] tags,
                       String authorId, String categoryId, int viewCount, String status,
                       Instant createdAt, Instant updatedAt, Author author, Counts _count,
                       boolean isLiked, boolean isCollected) {
        public static Post from(PostRow row) {
            return new Post(row.id(), row.title(), row.content(), row.images(), row.tags(), row.authorId(),
                    row.categoryId(), row.viewCount(), row.status(), row.createdAt(), row.updatedAt(),
                    new Author(row.authorId(), row.authorName(), row.authorImage(), row.authorSchool(), row.authorRole()),
                    new Counts(row.likesCount(), row.collectionsCount(), row.commentsCount()),
                    row.isLiked(), row.isCollected());
        }
    }
    public record Comment(String id, String content, String userId, String postId,
                          Instant createdAt, Instant updatedAt, Author user) {
        public static Comment from(CommentRow row) {
            return new Comment(row.id(), row.content(), row.userId(), row.postId(), row.createdAt(), row.updatedAt(),
                    new Author(row.userId(), row.userName(), row.userImage(), row.userSchool(), row.userRole()));
        }
    }
}
