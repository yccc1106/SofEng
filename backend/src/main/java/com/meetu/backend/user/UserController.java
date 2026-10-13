package com.meetu.backend.user;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.user.dto.UserDtos.Profile;
import com.meetu.backend.user.dto.UserDtos.ProfileUpdate;
import com.meetu.backend.user.dto.UserDtos.Registration;
import com.meetu.backend.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Profile>> register(@Valid @RequestBody Registration request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", Profile.from(users.register(request))));
    }

    @GetMapping("/profile")
    public ApiResponse<Profile> profile(Authentication authentication) {
        return ApiResponse.success("User profile retrieved", Profile.from(users.profile(authentication.getName())));
    }

    @PutMapping("/profile")
    public ApiResponse<Profile> update(@Valid @RequestBody ProfileUpdate request, Authentication authentication) {
        return ApiResponse.success("User profile updated", Profile.from(users.update(authentication.getName(), request)));
    }
}
