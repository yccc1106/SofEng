package com.meetu.backend.team.service.impl;

import com.meetu.backend.team.dto.TeamDtos;
import com.meetu.backend.team.mapper.TeamMapper;
import com.meetu.backend.team.service.TeamService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TeamServiceImpl implements TeamService {
    private final TeamMapper mapper;
    public TeamServiceImpl(TeamMapper mapper) { this.mapper=mapper; }

    @Override public List<TeamDtos.Team> list(String viewer,boolean mine,String type,String categoryId) {
        if (mine && viewer==null) throw new TeamUnauthorized();
        return mapper.list(viewer,mine,type,categoryId).stream().map(TeamServiceImpl::team).toList();
    }
    @Override @Transactional public TeamDtos.Team create(String userId,TeamDtos.Create input) {
        String name=input.name().trim();
        if (name.isEmpty()) throw new InvalidTeamRequest("Team name is required");
        int max=input.maxMembers()==null ? 5 : input.maxMembers();
        if (max<2 || max>20) throw new InvalidTeamRequest("Max members must be 2 to 20");
        if (input.categoryId()!=null && mapper.category(input.categoryId())==null) throw new InvalidTeamRequest("Category not found");
        String id=UUID.randomUUID().toString();
        mapper.insertTeam(id,name,input.description()==null ? null : input.description().trim(),
                input.type()==null ? null : input.type().trim(),max,input.requiresApproval()==null || input.requiresApproval(),
                userId,input.categoryId());
        mapper.insertMember(UUID.randomUUID().toString(),id,userId,"LEADER","JOINED",null);
        return team(mapper.team(id));
    }
    @Override @Transactional public TeamDtos.Member join(String userId,TeamDtos.Join input) {
        var locked=mapper.lockTeam(input.teamId());
        if (locked==null) throw new TeamNotFound();
        if (!"RECRUITING".equals(s(locked,"status"))) throw new TeamConflict("Team is not recruiting");
        if (mapper.activeUser(userId)==null) throw new TeamForbidden();
        long count=mapper.joinedCount(input.teamId());
        int max=((Number)locked.get("maxMembers")).intValue();
        if (count>=max) throw new TeamConflict("Team is full");
        var existing=mapper.memberForUser(input.teamId(),userId);
        if (existing!=null && !"REJECTED".equals(s(existing,"status"))) throw new TeamConflict("Already joined or application pending");
        boolean approval=Boolean.TRUE.equals(locked.get("requiresApproval"));
        String status=approval ? "PENDING" : "JOINED";
        String message=input.message()==null ? null : input.message().trim();
        String id;
        if (existing==null) {
            id=UUID.randomUUID().toString();
            try { mapper.insertMember(id,input.teamId(),userId,"MEMBER",status,message); }
            catch (DataIntegrityViolationException exception) { throw new TeamConflict("Already joined or application pending"); }
        } else {
            id=s(existing,"id");
            mapper.reapply(id,status,message);
        }
        if (!approval && count+1>=max) mapper.markFull(input.teamId());
        return member(mapper.member(id),null,null);
    }
    @Override public List<TeamDtos.Member> requests(String userId) {
        return mapper.pending(userId).stream().map(r -> member(r,
                new TeamDtos.Person(s(r,"userId"),s(r,"userName"),s(r,"userImage"),s(r,"userSchool")),
                new TeamDtos.TeamSummary(s(r,"teamId"),s(r,"teamName")))).toList();
    }
    @Override @Transactional public TeamDtos.Member decide(String userId,TeamDtos.Decision input) {
        if (!"JOINED".equals(input.status()) && !"REJECTED".equals(input.status())) throw new InvalidTeamRequest("Invalid status");
        var first=mapper.member(input.memberId());
        if (first==null) throw new TeamNotFound();
        var team=mapper.lockTeam(s(first,"teamId"));
        if (team==null) throw new TeamNotFound();
        if (!userId.equals(s(team,"creatorId"))) throw new TeamForbidden();
        var current=mapper.member(input.memberId());
        if (current==null) throw new TeamNotFound();
        if (!"PENDING".equals(s(current,"status"))) throw new TeamConflict("Request already processed");
        if ("JOINED".equals(input.status())) {
            if (!"RECRUITING".equals(s(team,"status"))) throw new TeamConflict("Team is not recruiting");
            if (mapper.activeUser(s(current,"userId"))==null) throw new TeamConflict("Applicant account is inactive");
            long count=mapper.joinedCount(s(team,"id"));
            int max=((Number)team.get("maxMembers")).intValue();
            if (count>=max) throw new TeamConflict("Team is full");
            if (mapper.decide(input.memberId(),"JOINED")!=1) throw new TeamConflict("Request already processed");
            if (count+1>=max) mapper.markFull(s(team,"id"));
        } else if (mapper.decide(input.memberId(),"REJECTED")!=1) throw new TeamConflict("Request already processed");
        return member(mapper.member(input.memberId()),null,null);
    }
    public static TeamDtos.Team team(Map<String,Object> r) {
        return new TeamDtos.Team(s(r,"id"),s(r,"name"),s(r,"description"),s(r,"type"),((Number)r.get("maxMembers")).intValue(),
                s(r,"status"),Boolean.TRUE.equals(r.get("requiresApproval")),s(r,"creatorId"),s(r,"categoryId"),instant(r.get("createdAt")),
                new TeamDtos.Person(s(r,"creatorUserId"),s(r,"creatorName"),s(r,"creatorImage"),s(r,"creatorSchool")),
                new TeamDtos.Count(((Number)r.get("joinedCount")).longValue()));
    }
    private static TeamDtos.Member member(Map<String,Object> r,TeamDtos.Person user,TeamDtos.TeamSummary team) {
        return new TeamDtos.Member(s(r,"id"),s(r,"teamId"),s(r,"userId"),s(r,"role"),s(r,"status"),s(r,"joinMessage"),instant(r.get("joinedAt")),user,team);
    }
    private static String s(Map<String,Object> r,String key) { return r.get(key)==null ? null : r.get(key).toString(); }
    private static Instant instant(Object value) { return value instanceof Timestamp t ? t.toInstant() : value instanceof Instant i ? i : null; }
    public static class InvalidTeamRequest extends RuntimeException { public InvalidTeamRequest(String message) { super(message); } }
    public static class TeamConflict extends RuntimeException { public TeamConflict(String message) { super(message); } }
    public static class TeamNotFound extends RuntimeException {}
    public static class TeamForbidden extends RuntimeException {}
    public static class TeamUnauthorized extends RuntimeException {}
}
