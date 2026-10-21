package com.meetu.backend.radar;

import org.springframework.stereotype.Service;

import java.util.*;

/** 匹配评分智能体：只用固定、可解释的本地规则，不把排名交给模型。 */
@Service
public class RadarScoringAgent {
    private static final List<List<String>> KEYWORD_GROUPS = List.of(
            List.of("运动", "体育", "打球", "篮球", "足球", "羽毛球", "跑步", "健身", "sport", "sports", "basketball", "football"),
            List.of("游戏", "电竞", "桌游", "game", "gaming", "esports"),
            List.of("学习", "自习", "考研", "课程", "study", "learning"),
            List.of("音乐", "唱歌", "乐队", "music", "singing"),
            List.of("电影", "追剧", "影视", "movie", "film"),
            List.of("旅行", "旅游", "出游", "travel")
    );
    private static final List<String> MBTI_DIMENSIONS =
            List.of("社交方式", "信息偏好", "决策方式", "生活节奏");
    private static final List<String> EXTRAVERSION_KEYWORDS =
            List.of("开朗", "外向", "活泼", "热情", "outgoing", "extroverted");

    public Scored score(RadarCandidateAgent.CandidateContext context,
                        RadarDtos.Candidate candidate,
                        RadarDtos.Intent intent) {
        var viewer = context.viewer();
        Set<String> currentInterests = context.viewerInterestIds();
        Set<String> candidateInterests = candidate.interestIds();
        List<String> sharedInterestIds = currentInterests.stream()
                .filter(candidateInterests::contains)
                .toList();
        List<String> sharedInterestNames = sharedInterestIds.stream()
                .map(context.categoryNames()::get)
                .filter(Objects::nonNull)
                .toList();
        List<String> sharedTags = sharedTags(viewer.personalityTags(), candidate.personalityTags());
        List<String> sameDimensions = sameMbtiDimensions(viewer.personalityType(), candidate.personalityType());
        String exactMbti = viewer.personalityType() != null
                && viewer.personalityType().equals(candidate.personalityType())
                ? candidate.personalityType() : null;

        String candidateInterestText = candidateInterests.stream()
                .map(context.categoryNames()::get)
                .filter(Objects::nonNull)
                .reduce((first, second) -> first + " " + second)
                .orElse("") + " " + (candidate.bio() == null ? "" : candidate.bio());
        List<String> matchedInterests = intent == null ? List.of()
                : intent.interestKeywords().stream()
                .filter(keyword -> matchesKeyword(candidateInterestText, keyword))
                .toList();
        List<String> matchedTraits = intent == null ? List.of()
                : intent.personalityKeywords().stream()
                .filter(keyword -> matchesPersonalityKeyword(candidate, keyword))
                .toList();
        boolean sameSchool = viewer.school() != null && viewer.school().equals(candidate.school());
        boolean sameMajor = viewer.major() != null && viewer.major().equals(candidate.major());
        boolean sameGrade = viewer.grade() != null && viewer.grade().equals(candidate.grade());
        boolean active = candidate.activityCount() >= 5;

        int score = 0;
        if (!sharedInterestIds.isEmpty()) score += Math.min(45, sharedInterestIds.size() * 10 + 8);
        if (exactMbti != null) score += 18;
        else if (!sameDimensions.isEmpty()) score += Math.min(10, sameDimensions.size() * 3);
        if (!sharedTags.isEmpty()) score += Math.min(12, sharedTags.size() * 4);
        if (sameSchool) score += 10;
        if (sameMajor) score += 5;
        if (sameGrade) score += 3;
        if (!matchedInterests.isEmpty()) score += Math.min(24, matchedInterests.size() * 8);
        if (!matchedTraits.isEmpty()) score += Math.min(16, matchedTraits.size() * 8);
        if (intent != null && intent.preferSameMajor() && sameMajor) score += 6;
        if (active) score += 5;

        var evidence = new RadarDtos.Evidence(
                sharedInterestNames, exactMbti, sameDimensions, sharedTags,
                sameSchool, sameMajor, sameGrade, matchedInterests, matchedTraits,
                intent != null && intent.preferSameMajor() && sameMajor,
                active
        );
        return new Scored(Math.min(99, Math.max(20, score)), evidence);
    }

    private static List<String> sharedTags(String[] current, String[] candidate) {
        if (current == null || candidate == null) return List.of();
        Set<String> candidateTags = new HashSet<>(Arrays.asList(candidate));
        return Arrays.stream(current).filter(candidateTags::contains).distinct().toList();
    }

    private static List<String> sameMbtiDimensions(String current, String candidate) {
        if (current == null || candidate == null || current.length() != candidate.length()) return List.of();
        List<String> result = new ArrayList<>();
        for (int index = 0; index < current.length() && index < MBTI_DIMENSIONS.size(); index++) {
            if (current.charAt(index) == candidate.charAt(index)) result.add(MBTI_DIMENSIONS.get(index));
        }
        return result;
    }

    private static boolean matchesPersonalityKeyword(RadarDtos.Candidate candidate, String keyword) {
        String text = String.join(" ", candidate.personalityTags() == null
                ? List.of() : Arrays.asList(candidate.personalityTags()))
                + " " + (candidate.bio() == null ? "" : candidate.bio());
        if (matchesKeyword(text, keyword)) return true;
        String normalized = normalize(keyword);
        return EXTRAVERSION_KEYWORDS.stream().anyMatch(normalized::contains)
                && candidate.personalityType() != null
                && candidate.personalityType().startsWith("E");
    }

    static boolean matchesKeyword(String text, String keyword) {
        String normalizedText = normalize(text);
        String normalizedKeyword = normalize(keyword);
        if (normalizedKeyword.isBlank()) return false;
        if (normalizedText.contains(normalizedKeyword)) return true;
        for (List<String> group : KEYWORD_GROUPS) {
            if (group.stream().anyMatch(normalizedKeyword::contains)) {
                return group.stream().anyMatch(normalizedText::contains);
            }
        }
        return false;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    public record Scored(int score, RadarDtos.Evidence evidence) {}
}
