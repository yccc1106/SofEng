package com.meetu.backend.user.service;

import com.meetu.backend.user.dto.PersonalityDtos;
import java.util.List;

public interface PersonalityService {
    PersonalityDtos.Result save(String userId, PersonalityDtos.Answers request);
    List<PersonalityDtos.Match> matches(String userId);
}
