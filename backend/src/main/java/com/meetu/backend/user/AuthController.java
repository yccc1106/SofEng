package com.meetu.backend.user;

import com.meetu.backend.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final HttpSessionSecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public AuthController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public record Login(@NotBlank @Email String email, @NotBlank String password) {}

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody Login request,
                                                                       HttpServletRequest servletRequest,
                                                                       HttpServletResponse servletResponse) {
        var user = users.findByEmail(request.email().trim()).orElse(null);
        if (user == null || user.password() == null || !encoder.matches(request.password(), user.password())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
        }
        if (!"ACTIVE".equals(user.status())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Account is restricted"));
        }
        servletRequest.getSession();
        servletRequest.changeSessionId();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(user.id(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.role()))));
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, servletRequest, servletResponse);
        return ResponseEntity.ok(ApiResponse.success("Login successful", UserController.Profile.from(user)));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        return ApiResponse.success("Logged out", null);
    }
}
