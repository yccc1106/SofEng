package com.meetu.backend.team.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;

public final class TeamDtos {
    private TeamDtos() {}
    public record Create(@NotBlank @Size(max=100) String name, @Size(max=2000) String description,
                         @Size(max=30) String type, @Min(2) @Max(20) Integer maxMembers, String categoryId,
                         Boolean requiresApproval) {}
    public record Join(@NotBlank String teamId, @Size(max=500) String message) {}
    public record Decision(@NotBlank String memberId, @NotBlank String status) {}
    public record Person(String id,String name,String image,String school) {}
    public record Count(long members) {}
    public record Team(String id,String name,String description,String type,int maxMembers,String status,
                       boolean requiresApproval,String creatorId,String categoryId,Instant createdAt,
                       Person creator,Count _count) {}
    public record TeamSummary(String id,String name) {}
    public record Member(String id,String teamId,String userId,String role,String status,String joinMessage,
                         Instant joinedAt,Person user,TeamSummary team) {}
}
