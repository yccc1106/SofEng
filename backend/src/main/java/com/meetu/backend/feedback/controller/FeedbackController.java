package com.meetu.backend.feedback.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.feedback.dto.FeedbackDtos.*;
import com.meetu.backend.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/** 区分用户自己的反馈接口与管理员处理接口。 */
@RestController
public class FeedbackController {
    private final FeedbackService service;
    public FeedbackController(FeedbackService service) { this.service=service; }
    @PostMapping("/api/feedback") public ApiResponse<Map<String,Object>> submit(Authentication auth,@Valid @RequestBody Submit request) { return ApiResponse.success("Feedback submitted",service.submit(auth.getName(),request)); }
    @GetMapping("/api/feedback") public ApiResponse<List<Map<String,Object>>> mine(Authentication auth) { return ApiResponse.success("Feedbacks retrieved",service.mine(auth.getName())); }
    @GetMapping("/api/admin/feedback") public ApiResponse<List<Map<String,Object>>> all(@RequestParam(required=false) String type) { return ApiResponse.success("Feedbacks retrieved",service.all(type)); }
    @PutMapping("/api/admin/feedback") public ApiResponse<Void> handle(Authentication auth,@Valid @RequestBody Handle request) { service.handle(auth.getName(),request); return ApiResponse.success("Feedback updated",null); }
}
