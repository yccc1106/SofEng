package com.meetu.backend.user.dto;

import java.util.Map;

public final class PersonalityDtos {
    private PersonalityDtos() {}
    public record Answers(Map<Integer, String> answers) {}
    public record Result(String type, String[] tags) {}
    public record Match(String id, String name, String image, String school, String personalityType,
                        String[] personalityTags, String bio, int score, String scoreReason) {}
}
