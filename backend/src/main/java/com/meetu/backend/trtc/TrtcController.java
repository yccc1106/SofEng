package com.meetu.backend.trtc;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.user.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trtc")
public class TrtcController {
    private final UserService users;
    private final TrtcUserSigService userSigs;

    public TrtcController(UserService users, TrtcUserSigService userSigs) {
        this.users = users;
        this.userSigs = userSigs;
    }

    @GetMapping("/usersig")
    public ApiResponse<TrtcDtos.UserSig> usersig(Authentication auth) {
        var user = users.findActiveSessionUser(auth.getName()).orElseThrow();
        return ApiResponse.success("TRTC UserSig issued", userSigs.issue(user));
    }
}
