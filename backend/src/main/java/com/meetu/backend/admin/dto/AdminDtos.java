package com.meetu.backend.admin.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
public final class AdminDtos {
    private AdminDtos() {}
    public record UserAction(@NotBlank String id,@NotBlank String action,
                             @Size(max=100) String name,@Email @Size(max=255) String email,
                             @Size(max=200) String school,@Size(max=100) String major,
                             @Size(max=50) String grade,@Size(max=1000) String bio,String role) {}
    public record VerificationDecision(@NotBlank String id,@NotBlank String action,@Size(max=2000) String reviewNote) {}
    public record CategoryChange(String id,@NotBlank @Size(max=100) String name,String parentId,@Size(max=1000) String description) {}
}
