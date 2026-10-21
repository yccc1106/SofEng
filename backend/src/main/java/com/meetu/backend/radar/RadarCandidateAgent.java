package com.meetu.backend.radar;

import com.meetu.backend.user.entity.UserEntity;
import com.meetu.backend.user.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.sql.Array;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

/** 候选筛选智能体：从数据库读取用户画像并排除好友、待处理申请和异常账号。 */
@Service
public class RadarCandidateAgent {
    private final UserMapper users;
    private final RadarMapper mapper;

    public RadarCandidateAgent(UserMapper users, RadarMapper mapper) {
        this.users = users;
        this.mapper = mapper;
    }

    public CandidateContext load(String userId) {
        UserEntity viewer = users.findById(userId).orElseThrow();
        Set<String> viewerInterestIds = new HashSet<>(mapper.viewerInterestIds(userId));
        Map<String, String> categoryNames = mapper.categories().stream()
                .collect(Collectors.toMap(row -> string(row, "id"), row -> string(row, "name")));
        List<RadarDtos.Candidate> candidates = mapper.candidates(userId).stream()
                .map(this::candidate)
                .toList();
        return new CandidateContext(viewer, viewerInterestIds, candidates, categoryNames);
    }

    private RadarDtos.Candidate candidate(Map<String, Object> row) {
        Object activity = row.get("activityCount");
        int activityCount = activity instanceof Number number ? number.intValue() : 0;
        return new RadarDtos.Candidate(
                string(row, "id"), string(row, "name"), string(row, "image"),
                string(row, "school"), string(row, "major"), string(row, "grade"),
                string(row, "personalityType"), readArray(row.get("personalityTags")),
                string(row, "bio"), new HashSet<>(Arrays.asList(readArray(row.get("interestIds")))),
                activityCount
        );
    }

    static String[] readArray(Object value) {
        try {
            if (value instanceof Array array) {
                Object result = array.getArray();
                if (result instanceof String[] strings) return strings;
                if (result instanceof Object[] objects) {
                    return Arrays.stream(objects).map(String::valueOf).toArray(String[]::new);
                }
            }
            if (value instanceof String[] strings) return strings;
            if (value instanceof Collection<?> collection) {
                return collection.stream().map(String::valueOf).toArray(String[]::new);
            }
            return new String[0];
        } catch (SQLException exception) {
            throw new IllegalStateException("Unable to read radar array", exception);
        }
    }

    static String string(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? null : value.toString();
    }

    public record CandidateContext(UserEntity viewer, Set<String> viewerInterestIds,
                                   List<RadarDtos.Candidate> candidates,
                                   Map<String, String> categoryNames) {}
}
