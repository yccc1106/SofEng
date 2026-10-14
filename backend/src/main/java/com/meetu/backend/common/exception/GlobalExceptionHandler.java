package com.meetu.backend.common.exception;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.admin.service.ManagementException;
import com.meetu.backend.user.service.impl.UserServiceImpl.DuplicateEmailException;
import com.meetu.backend.user.service.impl.UserServiceImpl.InvalidCredentialsException;
import com.meetu.backend.user.service.impl.UserServiceImpl.RestrictedAccountException;
import com.meetu.backend.post.service.impl.PostServiceImpl.InvalidPostRequestException;
import com.meetu.backend.post.service.impl.PostServiceImpl.PostNotFoundException;
import com.meetu.backend.friend.service.impl.FriendServiceImpl.*;
import com.meetu.backend.team.service.impl.TeamServiceImpl.*;
import com.meetu.backend.search.service.impl.SearchServiceImpl.InvalidSearchRequest;
import com.meetu.backend.chat.service.impl.ChatServiceImpl.InvalidChatRequest;
import com.meetu.backend.chat.service.impl.ChatServiceImpl.ChatForbidden;
import com.meetu.backend.chat.service.impl.ChatServiceImpl.ChatNotFound;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        Map<String, List<String>> details = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            details.computeIfAbsent(fieldError.getField(), ignored -> new ArrayList<>())
                    .add(fieldError.getDefaultMessage() == null ? "Invalid value" : fieldError.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Validation failed", details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException exception) {
        Map<String, List<String>> details = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation -> details
                .computeIfAbsent(violation.getPropertyPath().toString(), ignored -> new ArrayList<>())
                .add(violation.getMessage()));
        return ResponseEntity.badRequest().body(ApiResponse.error("Validation failed", details));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableMessage() {
        return ResponseEntity.badRequest().body(ApiResponse.error("Malformed request body"));
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicateEmail() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("User already exists"));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
    }

    @ExceptionHandler(RestrictedAccountException.class)
    public ResponseEntity<ApiResponse<Void>> handleRestrictedAccount() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Account is restricted"));
    }

    @ExceptionHandler(InvalidPostRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidPost(InvalidPostRequestException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handlePostNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Post not found"));
    }

    @ExceptionHandler({InvalidFriendRequest.class, InvalidTeamRequest.class})
    public ResponseEntity<ApiResponse<Void>> handleBusinessInput(RuntimeException exception) {
        return ResponseEntity.badRequest().body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler({FriendConflict.class, TeamConflict.class})
    public ResponseEntity<ApiResponse<Void>> handleConflict(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler({FriendNotFound.class, TeamNotFound.class})
    public ResponseEntity<ApiResponse<Void>> handleMissing() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Resource not found"));
    }

    @ExceptionHandler({FriendForbidden.class, TeamForbidden.class})
    public ResponseEntity<ApiResponse<Void>> handleForbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
    }

    @ExceptionHandler(TeamUnauthorized.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
    }

    @ExceptionHandler(InvalidSearchRequest.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidSearch() {
        return ResponseEntity.badRequest().body(ApiResponse.error("Search query is too long"));
    }

    @ExceptionHandler(InvalidChatRequest.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidChat(InvalidChatRequest exception) {
        return ResponseEntity.badRequest().body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(ChatForbidden.class)
    public ResponseEntity<ApiResponse<Void>> handleChatForbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
    }

    @ExceptionHandler(ChatNotFound.class)
    public ResponseEntity<ApiResponse<Void>> handleChatNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Conversation not found"));
    }

    @ExceptionHandler(ManagementException.class)
    public ResponseEntity<ApiResponse<Void>> handleManagement(ManagementException exception) {
        HttpStatus status = switch (exception.kind()) {
            case INVALID -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
        };
        return ResponseEntity.status(status).body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataConflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Data conflict"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(Exception exception) {
        log.error("Unhandled request exception", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error"));
    }
}
