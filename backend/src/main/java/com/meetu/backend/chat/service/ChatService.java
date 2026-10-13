package com.meetu.backend.chat.service;

import com.meetu.backend.chat.dto.ChatDtos;
import java.util.List;

public interface ChatService {
    List<ChatDtos.Contact> contacts(String userId);
    List<ChatDtos.Message> history(String userId, ChatDtos.Target target, String before);
    ChatDtos.Message send(String userId, ChatDtos.Send input);
    void markRead(String userId, ChatDtos.Target target);
    String authorize(String userId, ChatDtos.Target target);
}
