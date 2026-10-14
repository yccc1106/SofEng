package com.meetu.backend.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class FeedbackDtos {
    private FeedbackDtos() {}
    public record Submit(@NotBlank @Size(max=5000) String content, String type,
                         @Size(max=255) String contact, String[] images, String reportType,
                         String reportedUserId, String reportedPostId, String reportedMessageId) {}
    public record Handle(@NotBlank String id,@NotBlank String status,String action,@Size(max=2000) String note) {}
}
