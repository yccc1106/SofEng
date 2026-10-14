package com.meetu.backend.user;

import com.meetu.backend.user.dto.PersonalityDtos;
import com.meetu.backend.user.entity.UserEntity;
import com.meetu.backend.user.mapper.PersonalityMapper;
import com.meetu.backend.user.mapper.UserMapper;
import com.meetu.backend.user.service.impl.PersonalityServiceImpl;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PersonalityRulesTests {
    private final PersonalityMapper mapper=mock(PersonalityMapper.class);
    private final UserMapper users=mock(UserMapper.class);
    private final PersonalityServiceImpl service=new PersonalityServiceImpl(mapper,users);

    @Test void derivesAndSavesResultFromAnswersOnly() {
        when(mapper.save(eq("u"),eq("ESTJ"),any(String[].class))).thenReturn(1);
        var result=service.save("u",new PersonalityDtos.Answers(Map.of(1,"E",2,"S",3,"T",4,"J")));
        assertEquals("ESTJ",result.type());
        assertArrayEquals(new String[]{"Outgoing","Realistic","Analytical"},result.tags());
        verify(mapper).save("u","ESTJ",result.tags());
    }

    @Test void rejectsMissingOrCrossDimensionAnswersWithoutSaving() {
        assertThrows(PersonalityServiceImpl.InvalidPersonalityAnswers.class,() -> service.save("u",new PersonalityDtos.Answers(Map.of(1,"E",2,"S",3,"E",4,"J"))));
        assertThrows(PersonalityServiceImpl.InvalidPersonalityAnswers.class,() -> service.save("u",new PersonalityDtos.Answers(Map.of(1,"E",2,"S",3,"T"))));
        verifyNoInteractions(mapper);
    }

    @Test void ranksDeterministicallyAndExcludesZeroScores() {
        when(users.findById("u")).thenReturn(Optional.of(new UserEntity("u","Me",null,null,null,"USER","ACTIVE",null,null,null,null,null,null,"ESTJ",new String[]{"Outgoing","Realistic","Analytical"},"UNVERIFIED")));
        when(mapper.candidates("u")).thenReturn(List.of(
                candidate("b","ESTJ",new String[]{"Outgoing","Realistic"}),
                candidate("a","ENFP",new String[]{"Outgoing"}),
                candidate("c","INFP",new String[]{"Reflective"})));
        var matches=service.matches("u");
        assertEquals(List.of("b","a"),matches.stream().map(PersonalityDtos.Match::id).toList());
        assertEquals(70,matches.get(0).score());
        assertEquals(30,matches.get(1).score());
    }
    private static Map<String,Object> candidate(String id,String type,String[] tags) {
        Map<String,Object> row=new HashMap<>(); row.put("id",id); row.put("name",id); row.put("personalityType",type); row.put("personalityTags",tags); return row;
    }
}
