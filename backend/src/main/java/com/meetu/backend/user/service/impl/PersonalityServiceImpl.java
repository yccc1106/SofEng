package com.meetu.backend.user.service.impl;

import com.meetu.backend.user.dto.PersonalityDtos;
import com.meetu.backend.user.entity.UserEntity;
import com.meetu.backend.user.mapper.PersonalityMapper;
import com.meetu.backend.user.mapper.UserMapper;
import com.meetu.backend.user.service.PersonalityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Array;
import java.sql.SQLException;
import java.util.*;

@Service
public class PersonalityServiceImpl implements PersonalityService {
    private static final Set<String> ALLOWED_TAGS = Set.of("Outgoing","Reflective","Realistic","Dreamer","Analytical","Empathetic");
    private static final List<Set<String>> CHOICES = List.of(Set.of("E","I"), Set.of("S","N"), Set.of("T","F"), Set.of("J","P"));
    private final PersonalityMapper mapper;
    private final UserMapper users;
    public PersonalityServiceImpl(PersonalityMapper mapper, UserMapper users) { this.mapper=mapper; this.users=users; }

    @Override @Transactional public PersonalityDtos.Result save(String userId, PersonalityDtos.Answers request) {
        Map<Integer,String> answers=request==null ? null : request.answers();
        if (answers==null || answers.size()!=4) throw new InvalidPersonalityAnswers();
        StringBuilder type=new StringBuilder();
        for (int i=1;i<=4;i++) {
            String answer=answers.get(i);
            if (!CHOICES.get(i-1).contains(answer)) throw new InvalidPersonalityAnswers();
            type.append(answer);
        }
        String[] tags=tags(type.toString());
        if (mapper.save(userId,type.toString(),tags)!=1) throw new IllegalStateException("Active user disappeared");
        return new PersonalityDtos.Result(type.toString(),tags);
    }

    static String[] tags(String type) {
        List<String> result=new ArrayList<>();
        if (type.charAt(0)=='E') result.add("Outgoing"); else result.add("Reflective");
        if (type.charAt(1)=='S') result.add("Realistic"); else result.add("Dreamer");
        if (type.charAt(2)=='T') result.add("Analytical"); else result.add("Empathetic");
        return result.toArray(String[]::new);
    }

    @Override public List<PersonalityDtos.Match> matches(String userId) {
        UserEntity viewer=users.findById(userId).orElseThrow();
        if (!validType(viewer.personalityType())) return List.of();
        Set<String> ownTags=new HashSet<>(Arrays.asList(viewer.personalityTags()));
        ownTags.retainAll(ALLOWED_TAGS);
        return mapper.candidates(userId).stream().filter(row -> validType((String)row.get("personalityType"))).map(row -> {
            String type=(String)row.get("personalityType");
            String[] tags=readTags(row.get("personalityTags"));
            int shared=(int)Arrays.stream(tags).distinct().filter(ALLOWED_TAGS::contains).filter(ownTags::contains).count();
            int typeScore=type.equals(viewer.personalityType()) ? 50 : type.charAt(0)==viewer.personalityType().charAt(0) ? 20 : 0;
            int score=Math.min(100,typeScore+shared*10);
            String reason=(typeScore==50 ? "性格类型相同" : typeScore==20 ? "性格首维相同" : "性格首维不同")+"，共同标签 "+shared+" 个";
            return new PersonalityDtos.Match((String)row.get("id"),(String)row.get("name"),(String)row.get("image"),
                    (String)row.get("school"),type,tags,(String)row.get("bio"),score,reason);
        }).filter(match -> match.score()>0).sorted(Comparator.comparingInt(PersonalityDtos.Match::score).reversed().thenComparing(PersonalityDtos.Match::id)).limit(5).toList();
    }

    private static boolean validType(String type) {
        if (type==null || type.length()!=4) return false;
        for (int i=0;i<4;i++) if (!CHOICES.get(i).contains(type.substring(i,i+1))) return false;
        return true;
    }

    private static String[] readTags(Object value) {
        try {
            if (value instanceof Array array) return (String[])array.getArray();
            if (value instanceof String[] strings) return strings;
            return new String[0];
        } catch (SQLException exception) { throw new IllegalStateException("Could not read tags",exception); }
    }
    public static class InvalidPersonalityAnswers extends RuntimeException {}
}
