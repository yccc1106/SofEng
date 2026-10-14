package com.meetu.backend.moderation.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public final class ModerationDtos {
    private ModerationDtos() {}
    public record Decision(@NotBlank String id,@NotBlank String action,@Size(max=2000) String note) {}
}
