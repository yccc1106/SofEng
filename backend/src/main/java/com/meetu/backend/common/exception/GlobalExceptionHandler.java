package com.meetu.backend.common.exception;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.user.service.impl.UserServiceImpl.DuplicateEmailException;
import com.meetu.backend.user.service.impl.UserServiceImpl.InvalidCredentialsException;
import com.meetu.backend.user.service.impl.UserServiceImpl.RestrictedAccountException;
import com.meetu.backend.post.service.impl.PostServiceImpl.InvalidPostRequestException;
import com.meetu.backend.post.service.impl.PostServiceImpl.PostNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(Exception exception) {
        log.error("Unhandled request exception", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error"));
    }
}
