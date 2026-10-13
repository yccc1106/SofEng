package com.meetu.backend.user;

import com.meetu.backend.common.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public UserController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public record Registration(@NotBlank @Size(max = 100) String name,
                               @NotBlank @Email @Size(max = 255) String email,
                               @NotBlank @Size(min = 8, max = 72) String password,
                               @Size(max = 100) String studentId, @Size(max = 200) String school) {}

    public record ProfileUpdate(@NotBlank @Size(max = 100) String name,
                                @Size(max = 200) String school, @Size(max = 100) String major,
                                @Size(max = 50) String grade, @Size(max = 1000) String bio) {}

    public record Profile(String id, String name, String email, String image, String role,
                          String status, String studentId, String school, String major, String grade,
                          String bio, String gender, String personalityType, String[] personalityTags,
                          String verificationStatus) {
        static Profile from(UserRepository.User user) {
            return new Profile(user.id(), user.name(), user.email(), user.image(), user.role(),
                    user.status(), user.studentId(), user.school(), user.major(), user.grade(),
                    user.bio(), user.gender(), user.personalityType(), user.personalityTags(),
                    user.verificationStatus());
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Profile>> register(@Valid @RequestBody Registration request) {
        String email = request.email().trim().toLowerCase(java.util.Locale.ROOT);
        if (users.findByEmail(email).isPresent()) {
            throw new DuplicateEmailException();
        }
        try {
            var user = users.create(request.name().trim(), email, encoder.encode(request.password()),
                    request.studentId(), request.school());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("User created successfully", Profile.from(user)));
        } catch (DataIntegrityViolationException exception) {
            Throwable cause = exception;
            while (cause != null) {
                if (cause instanceof java.sql.SQLException sql && "23505".equals(sql.getSQLState())) {
                    throw new DuplicateEmailException();
                }
                cause = cause.getCause();
            }
            throw exception;
        }
    }

    @GetMapping("/profile")
    public ApiResponse<Profile> profile(Authentication authentication) {
        return ApiResponse.success("User profile retrieved", Profile.from(current(authentication)));
    }

    @PutMapping("/profile")
    public ApiResponse<Profile> update(@Valid @RequestBody ProfileUpdate request, Authentication authentication) {
        current(authentication);
        var user = users.updateProfile(authentication.getName(), request.name().trim(), request.school(),
                request.major(), request.grade(), request.bio());
        return ApiResponse.success("User profile updated", Profile.from(user));
    }

    private UserRepository.User current(Authentication authentication) {
        return users.findById(authentication.getName()).orElseThrow();
    }

    public static class DuplicateEmailException extends RuntimeException {}
}
