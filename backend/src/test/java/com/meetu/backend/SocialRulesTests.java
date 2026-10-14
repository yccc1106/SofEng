package com.meetu.backend;

import com.meetu.backend.friend.dto.FriendDtos;
import com.meetu.backend.friend.mapper.FriendMapper;
import com.meetu.backend.friend.service.impl.FriendServiceImpl;
import com.meetu.backend.team.dto.TeamDtos;
import com.meetu.backend.team.mapper.TeamMapper;
import com.meetu.backend.team.service.impl.TeamServiceImpl;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class SocialRulesTests {
    @Test void reversePendingRequestCannotCreateAnother() {
        FriendMapper mapper=mock(FriendMapper.class);
        when(mapper.lockActiveUser(anyString())).thenAnswer(call -> call.getArgument(0));
        when(mapper.pending("a","a","b")).thenReturn(Map.of("id","pending"));
        var service=new FriendServiceImpl(mapper);
        assertThrows(FriendServiceImpl.FriendConflict.class,() -> service.send("a",new FriendDtos.Send("b",null)));
        verify(mapper,never()).insertRequest(anyString(),anyString(),anyString(),any());
    }

    @Test void onlyReceiverCanDecideFriendRequest() {
        FriendMapper mapper=mock(FriendMapper.class);
        when(mapper.request("request")).thenReturn(Map.of("senderId","a","receiverId","b"));
        var service=new FriendServiceImpl(mapper);
        assertThrows(FriendServiceImpl.FriendForbidden.class,
                () -> service.decide("outsider","request",new FriendDtos.Decision("ACCEPT")));
        verify(mapper,never()).decide(anyString(),anyString());
    }

    @Test void fullTeamRejectsJoinBeforeInsert() {
        TeamMapper mapper=mock(TeamMapper.class);
        when(mapper.lockTeam("team")).thenReturn(Map.of("id","team","status","RECRUITING","maxMembers",2));
        when(mapper.activeUser("applicant")).thenReturn("applicant");
        when(mapper.joinedCount("team")).thenReturn(2L);
        var service=new TeamServiceImpl(mapper);
        assertThrows(TeamServiceImpl.TeamConflict.class,() -> service.join("applicant",new TeamDtos.Join("team",null)));
        verify(mapper,never()).insertMember(anyString(),anyString(),anyString(),anyString(),anyString(),any());
    }

    @Test void onlyCreatorCanApproveTeamRequest() {
        TeamMapper mapper=mock(TeamMapper.class);
        when(mapper.member("member")).thenReturn(Map.of("id","member","teamId","team"));
        when(mapper.lockTeam("team")).thenReturn(Map.of("id","team","creatorId","leader"));
        var service=new TeamServiceImpl(mapper);
        assertThrows(TeamServiceImpl.TeamForbidden.class,
                () -> service.decide("outsider",new TeamDtos.Decision("member","JOINED")));
        verify(mapper,never()).decide(anyString(),anyString());
    }
}
