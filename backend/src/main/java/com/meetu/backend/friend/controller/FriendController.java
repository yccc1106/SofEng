package com.meetu.backend.friend.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.friend.dto.FriendDtos;
import com.meetu.backend.friend.service.FriendService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {
    private final FriendService friends;
    public FriendController(FriendService friends) { this.friends = friends; }
    @GetMapping public ApiResponse<List<FriendDtos.Person>> list(Authentication auth) {
        return ApiResponse.success("Friends retrieved",friends.friends(auth.getName()));
    }
    @GetMapping("/requests") public ApiResponse<List<FriendDtos.Request>> requests(Authentication auth,
            @RequestParam(defaultValue="received") String type) {
        return ApiResponse.success("Friend requests retrieved",friends.requests(auth.getName(),type));
    }
    @PostMapping("/requests") public ResponseEntity<ApiResponse<FriendDtos.Request>> send(Authentication auth,
            @Valid @RequestBody FriendDtos.Send input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Friend request sent",friends.send(auth.getName(),input)));
    }
    @PutMapping("/requests/{id}") public ApiResponse<Void> decide(Authentication auth,@PathVariable String id,
            @Valid @RequestBody FriendDtos.Decision input) {
        friends.decide(auth.getName(),id,input);
        return ApiResponse.success("Request processed",null);
    }
}
