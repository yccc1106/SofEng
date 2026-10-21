package com.meetu.backend.radar;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/** 推荐解释智能体：只依据评分证据生成可验证的理由。 */
@Service
public class RadarExplanationAgent {
    public List<String> explain(RadarDtos.Evidence evidence) {
        List<String> reasons = new ArrayList<>();
        if (!evidence.sharedInterestNames().isEmpty())
            reasons.add("共同关注：" + join(evidence.sharedInterestNames(), 2));
        if (evidence.exactMbti() != null)
            reasons.add("MBTI 同为 " + evidence.exactMbti());
        else if (!evidence.sameMbtiDimensions().isEmpty())
            reasons.add("相似的" + join(evidence.sameMbtiDimensions(), 2));
        if (!evidence.sharedTags().isEmpty())
            reasons.add("共同特质：" + join(evidence.sharedTags(), 2));
        if (evidence.sameSchool()) reasons.add("同校同学");
        if (evidence.sameMajor()) reasons.add("专业相同");
        if (evidence.sameGrade()) reasons.add("年级相近");
        if (!evidence.matchedInterests().isEmpty())
            reasons.add("符合你的活动偏好：" + join(evidence.matchedInterests(), 2));
        if (!evidence.matchedTraits().isEmpty())
            reasons.add("符合你的性格偏好：" + join(evidence.matchedTraits(), 2));
        if (evidence.preferSameMajor()) reasons.add("符合你的同专业偏好");
        if (evidence.active()) reasons.add("社区活跃度较高");
        return reasons.isEmpty() ? List.of("可进一步浏览资料了解对方") : reasons.stream().limit(3).toList();
    }

    private static String join(List<String> values, int limit) {
        return String.join("、", values.stream().limit(limit).toList());
    }
}
