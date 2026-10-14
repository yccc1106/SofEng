package com.meetu.backend.user.entity;

public record UserEntity(String id, String name, String email, String password, String image,
                         String role, String status, String studentId, String school, String major,
                         String grade, String bio, String gender, String personalityType,
                         String[] personalityTags, String verificationStatus) {}
