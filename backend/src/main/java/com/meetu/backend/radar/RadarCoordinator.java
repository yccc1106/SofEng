package com.meetu.backend.radar;

import com.meetu.backend.radar.RadarCandidateAgent.CandidateContext;
import com.meetu.backend.user.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.util.*;

/** 协调智能体：组织需求理解、候选筛选、评分和解释。 */
@Service
public class RadarCoordinator {
    private final UserMapper users;
    private final RadarIntentAgent intentions;
    private final RadarCandidateAgent candidates;
    private final RadarScoringAgent scoring;
    private final RadarExplanationAgent explanations;

    public RadarCoordinator(UserMapper users, RadarIntentAgent intentions,
                            RadarCandidateAgent candidates, RadarScoringAgent scoring,
                            RadarExplanationAgent explanations) {
        this.users = users;
        this.intentions = intentions;
        this.candidates = candidates;
        this.scoring = scoring;
        this.explanations = explanations;
    }

    public RadarDtos.Result recommend(String userId, String query) {
        var viewer = users.findById(userId).orElseThrow();
        RadarDtos.Intent intent = intentions.infer(query);
        CandidateContext context = candidates.load(userId);

        List<RadarDtos.Candidate> filtered = context.candidates();
        if (intent != null && intent.preferSameSchool()
                && viewer.school() != null && !viewer.school().isBlank()) {
            filtered = filtered.stream()
                    .filter(candidate -> viewer.school().equals(candidate.school()))
                    .toList();
        }

        List<RadarDtos.Match> matches = filtered.stream().map(candidate -> {
            var scored = scoring.score(context, candidate, intent);
            return new RadarDtos.Match(
                    candidate.id(), candidate.name(), candidate.image(), candidate.school(),
                    candidate.major(), candidate.personalityType(), candidate.personalityTags(),
                    candidate.bio(), scored.score(), explanations.explain(scored.evidence())
            );
        }).sorted(Comparator.comparingInt(RadarDtos.Match::score).reversed()
                .thenComparing(RadarDtos.Match::id)).limit(8).toList();

        String summary = intent != null && intent.summary() != null && !intent.summary().isBlank()
                ? intent.summary()
                : query != null && !query.isBlank() ? "已按你的文字需求进行本地匹配" : "";
        RadarDtos.AppliedFilters filters = intent == null ? null
                : new RadarDtos.AppliedFilters(intent.interestKeywords(), intent.personalityKeywords(),
                intent.preferSameSchool(), intent.preferSameMajor());
        return new RadarDtos.Result(matches, intent != null, summary, filters);
    }
}
