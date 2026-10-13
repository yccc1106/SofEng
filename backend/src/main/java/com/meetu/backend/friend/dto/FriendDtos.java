package com.meetu.backend.friend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class FriendDtos {
    private FriendDtos() {}
    public record Person(String id, String name, String image, String school, String role) {}
    public record Send(@NotBlank String receiverId, @Size(max = 500) String message) {}
    public record Decision(@NotBlank String action) {}
    public record Request(String id, String senderId, String receiverId, String status, String message,
                          Instant createdAt, Instant updatedAt, Person sender, Person receiver) {}
}
