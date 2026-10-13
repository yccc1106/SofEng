package com.meetu.backend.friend.service;

import com.meetu.backend.friend.dto.FriendDtos;
import java.util.List;

public interface FriendService {
    List<FriendDtos.Person> friends(String userId);
    List<FriendDtos.Request> requests(String userId, String type);
    FriendDtos.Request send(String userId, FriendDtos.Send input);
    void decide(String userId, String requestId, FriendDtos.Decision input);
}
