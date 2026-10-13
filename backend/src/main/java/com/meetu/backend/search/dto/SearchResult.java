package com.meetu.backend.search.dto;

import com.meetu.backend.post.dto.PostDtos;
import com.meetu.backend.team.dto.TeamDtos;
import java.util.List;

public record SearchResult(List<User> users,List<PostDtos.Post> posts,List<TeamDtos.Team> teams) {
    public record User(String id,String name,String image,String bio,String personalityType) {}
}
