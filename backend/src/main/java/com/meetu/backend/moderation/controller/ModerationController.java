package com.meetu.backend.moderation.controller;
import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.moderation.dto.ModerationDtos.Decision;
import com.meetu.backend.moderation.service.ModerationService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/admin/moderation")
public class ModerationController {
    private final ModerationService service;
    public ModerationController(ModerationService service) { this.service=service; }
    @GetMapping("/posts") public ApiResponse<List<Map<String,Object>>> posts(@RequestParam(required=false) String status) { return ApiResponse.success(service.posts(status)); }
    @PutMapping("/posts") public ApiResponse<Void> decidePost(Authentication auth,@Valid @RequestBody Decision decision) { service.decidePost(auth.getName(),decision); return ApiResponse.success("Post updated",null); }
    @GetMapping("/chats") public ApiResponse<List<Map<String,Object>>> chats() { return ApiResponse.success(service.chats()); }
    @DeleteMapping("/chats") public ApiResponse<Void> blockChat(Authentication auth,@RequestParam String id) { service.blockChat(auth.getName(),id); return ApiResponse.success("Message blocked",null); }
    @GetMapping("/rooms") public ApiResponse<List<Map<String,Object>>> rooms() { return ApiResponse.success(service.rooms()); }
    @PutMapping("/rooms") public ApiResponse<Void> closeRoom(Authentication auth,@Valid @RequestBody Decision decision) { service.closeRoom(auth.getName(),decision); return ApiResponse.success("Room updated",null); }
}
