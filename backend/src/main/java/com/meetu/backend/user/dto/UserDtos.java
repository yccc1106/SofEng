package com.meetu.backend.user.dto;

import com.meetu.backend.user.entity.UserEntity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class UserDtos {
    private UserDtos() {}

    public record Login(@NotBlank @Email String email, @NotBlank String password) {}
    public record Registration(@NotBlank @Size(max = 100) String name,
                               @NotBlank @Email @Size(max = 255) String email,
                               @NotBlank @Size(min = 8, max = 72) String password,
                               @Size(max = 100) String studentId, @Size(max = 200) String school) {}
    public record ProfileUpdate(@NotBlank @Size(max = 100) String name,
                                @Size(max = 200) String school, @Size(max = 100) String major,
                                @Size(max = 50) String grade, @Size(max = 1000) String bio) {}
    public record Profile(String id, String name, String email, String image, String role,
                          String status, String studentId, String school, String major, String grade,
                          String bio, String gender, String personalityType, String[] personalityTags,
                          String verificationStatus) {
        public static Profile from(UserEntity user) {
            return new Profile(user.id(), user.name(), user.email(), user.image(), user.role(),
                    user.status(), user.studentId(), user.school(), user.major(), user.grade(),
                    user.bio(), user.gender(), user.personalityType(), user.personalityTags(),
                    user.verificationStatus());
        }
    }
}
