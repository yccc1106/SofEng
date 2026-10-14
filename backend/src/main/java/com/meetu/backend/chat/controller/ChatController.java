package com.meetu.backend.chat.controller;

import com.meetu.backend.chat.dto.ChatDtos;
import com.meetu.backend.chat.service.ChatService;
import com.meetu.backend.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** 提供联系人、历史消息、发送和已读接口；会话权限在 Service 中统一检查。 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chat;
    public ChatController(ChatService chat) { this.chat=chat; }
    @GetMapping("/contacts") public ApiResponse<List<ChatDtos.Contact>> contacts(Authentication auth) {
        return ApiResponse.success("Contacts retrieved",chat.contacts(auth.getName()));
    }
    @GetMapping public ApiResponse<List<ChatDtos.Message>> history(Authentication auth,
            @RequestParam(required=false) String userId,@RequestParam(required=false) String teamId,
            @RequestParam(required=false) String categoryId,@RequestParam(required=false) String before) {
        return ApiResponse.success("Messages retrieved",chat.history(auth.getName(),new ChatDtos.Target(userId,teamId,categoryId),before));
    }
    @PostMapping public ApiResponse<ChatDtos.Message> send(Authentication auth,@Valid @RequestBody ChatDtos.Send input) {
        return ApiResponse.success("Message sent",chat.send(auth.getName(),input));
    }
    @PostMapping("/read") public ApiResponse<Void> read(Authentication auth,@RequestBody ChatDtos.Read input) {
        chat.markRead(auth.getName(),new ChatDtos.Target(input.userId(),input.teamId(),input.categoryId()));
        return ApiResponse.success("Conversation read",null);
    }
}
