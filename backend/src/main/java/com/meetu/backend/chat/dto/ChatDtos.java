package com.meetu.backend.chat.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ChatDtos {
    private ChatDtos() {}
    public record Target(String userId, String teamId, String categoryId) {}
    public record Send(@Size(max=4000) String content, String receiverId, String teamId, String categoryId, String type) {}
    public record Read(String userId, String teamId, String categoryId) {}
    public record Sender(String id, String name, String image) {}
    public record Message(String id, String content, String type, String senderId, String receiverId,
                          String teamId, String categoryId, boolean isRead, Instant createdAt, Sender sender) {}
    public record Contact(String id, String name, String image, String type, String subType, long unreadCount) {}
}
