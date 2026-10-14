package com.meetu.backend.moderation.service;
import com.meetu.backend.moderation.dto.ModerationDtos.Decision;
import java.util.List;
import java.util.Map;
public interface ModerationService {
    List<Map<String,Object>> posts(String status);
    void decidePost(String admin,Decision decision);
    List<Map<String,Object>> chats();
    void blockChat(String admin,String id);
    List<Map<String,Object>> rooms();
    void closeRoom(String admin,Decision decision);
}
