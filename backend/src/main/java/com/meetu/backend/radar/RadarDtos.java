package com.meetu.backend.radar;

import java.util.List;
import java.util.Set;

public final class RadarDtos {
    private RadarDtos() {}

    public record Intent(List<String> interestKeywords, List<String> personalityKeywords,
                         boolean preferSameSchool, boolean preferSameMajor, String summary) {}

    public record Candidate(String id, String name, String image, String school, String major,
                            String grade, String personalityType, String[] personalityTags,
                            String bio, Set<String> interestIds, int activityCount) {}

    public record Evidence(List<String> sharedInterestNames, String exactMbti,
                           List<String> sameMbtiDimensions, List<String> sharedTags,
                           boolean sameSchool, boolean sameMajor, boolean sameGrade,
                           List<String> matchedInterests, List<String> matchedTraits,
                           boolean preferSameMajor, boolean active) {}

    public record Match(String id, String name, String image, String school, String major,
                        String personalityType, String[] personalityTags, String bio,
                        int score, List<String> matchReasons) {}

    public record AppliedFilters(List<String> interests, List<String> personality,
                                 boolean sameSchoolOnly, boolean preferSameMajor) {}

    public record Result(List<Match> matches, boolean aiAssisted, String intentSummary,
                         AppliedFilters appliedFilters) {}
}
