package com.meetu.backend.search.service.impl;

import com.meetu.backend.post.dto.PostDtos;
import com.meetu.backend.post.mapper.PostMapper;
import com.meetu.backend.search.dto.SearchResult;
import com.meetu.backend.search.service.SearchService;
import com.meetu.backend.team.mapper.TeamMapper;
import com.meetu.backend.team.service.impl.TeamServiceImpl;
import com.meetu.backend.user.mapper.UserMapper;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SearchServiceImpl implements SearchService {
    private final UserMapper users;
    private final PostMapper posts;
    private final TeamMapper teams;
    public SearchServiceImpl(UserMapper users,PostMapper posts,TeamMapper teams) {
        this.users=users; this.posts=posts; this.teams=teams;
    }
    @Override public SearchResult search(String viewer,String query) {
        String q=query==null ? "" : query.trim();
        if (q.isEmpty()) return new SearchResult(List.of(),List.of(),List.of());
        if (q.length()>100) throw new InvalidSearchRequest();
        var userResults=users.search(viewer,q).stream().map(r -> new SearchResult.User(
                String.valueOf(r.get("id")),(String)r.get("name"),(String)r.get("image"),
                (String)r.get("bio"),(String)r.get("personalityType"))).toList();
        return new SearchResult(userResults,posts.search(viewer,q).stream().map(PostDtos.Post::from).toList(),
                teams.search(q).stream().map(TeamServiceImpl::team).toList());
    }
    public static class InvalidSearchRequest extends RuntimeException {}
}
