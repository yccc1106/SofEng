package com.meetu.backend.user.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.user.dto.UserDtos.Login;
import com.meetu.backend.user.dto.UserDtos.Profile;
import com.meetu.backend.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    private final HttpSessionSecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public AuthController(UserService users) {
        this.users = users;
    }

    @PostMapping("/login")
    public ApiResponse<Profile> login(@Valid @RequestBody Login request,
                                                                       HttpServletRequest servletRequest,
                                                                       HttpServletResponse servletResponse) {
        var user = users.login(request);
        servletRequest.getSession();
        servletRequest.changeSessionId();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(user.id(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.role()))));
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, servletRequest, servletResponse);
        return ApiResponse.success("Login successful", Profile.from(user));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        return ApiResponse.success("Logged out", null);
    }
}
