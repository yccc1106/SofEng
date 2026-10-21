package com.meetu.backend.radar;

import com.meetu.backend.radar.RadarCandidateAgent.CandidateContext;
import com.meetu.backend.user.entity.UserEntity;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class RadarRulesTests {
    @Test
    void explainsSharedInterestsAndPersonalityPreference() {
        var viewer = new UserEntity("viewer", "Viewer", "viewer@example.test", null, null,
                "USER", "ACTIVE", null, null, "Computer Science", "2023",
                "喜欢篮球和编程", "SECRET", "ESTJ", new String[]{"Outgoing", "Analytical"}, "UNVERIFIED");
        var candidate = new RadarDtos.Candidate("candidate", "Candidate", null, null,
                "Computer Science", "2023", "ESTJ", new String[]{"Outgoing", "Analytical"},
                "周末篮球和编程", Set.of("category-sports"), 8);
        var context = new CandidateContext(viewer, Set.of("category-sports"),
                List.of(candidate), Map.of("category-sports", "篮球"));
        var intent = new RadarDtos.Intent(List.of("篮球"), List.of("开朗"),
                false, true, "找周末打篮球的开朗同学");

        var scored = new RadarScoringAgent().score(context, candidate, intent);
        var reasons = new RadarExplanationAgent().explain(scored.evidence());

        assertTrue(scored.score() >= 50);
        assertTrue(reasons.stream().anyMatch(reason -> reason.contains("共同关注：篮球")));
        assertTrue(reasons.stream().anyMatch(reason -> reason.contains("MBTI 同为 ESTJ")));
    }

    @Test
    void keywordGroupsMatchEquivalentSportsWords() {
        assertTrue(RadarScoringAgent.matchesKeyword("周末篮球和羽毛球", "打球"));
        assertFalse(RadarScoringAgent.matchesKeyword("一起看电影", "编程"));
    }
}
