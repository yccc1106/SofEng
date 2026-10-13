package com.meetu.backend.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        String error,
        Map<String, ?> details,
        Pagination pagination
) {
    public record Pagination(int page, int pageSize, long total, long totalPages) {}

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data, null, null, null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, null, null, null);
    }

    public static <T> ApiResponse<T> page(String message, T data, int page, int pageSize, long total) {
        return new ApiResponse<>(true, message, data, null, null,
                new Pagination(page, pageSize, total, (total + pageSize - 1) / pageSize));
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(false, message, null, message, null, null);
    }

    public static ApiResponse<Void> error(String message, Map<String, ?> details) {
        return new ApiResponse<>(false, message, null, message, details, null);
    }
}
