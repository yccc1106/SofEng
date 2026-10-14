package com.meetu.backend.team.service;

import com.meetu.backend.team.dto.TeamDtos;
import java.util.List;

public interface TeamService {
    List<TeamDtos.Team> list(String viewer,boolean mine,String type,String categoryId);
    TeamDtos.Team create(String userId,TeamDtos.Create input);
    TeamDtos.Member join(String userId,TeamDtos.Join input);
    List<TeamDtos.Member> requests(String userId);
    TeamDtos.Member decide(String userId,TeamDtos.Decision input);
}
