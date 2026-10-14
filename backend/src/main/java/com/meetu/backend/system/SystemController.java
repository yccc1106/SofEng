package com.meetu.backend.system;

import com.meetu.backend.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @Operation(summary = "检查 Java 后端服务是否可访问")
    @GetMapping("/ping")
    public ApiResponse<SystemStatus> ping() {
        return ApiResponse.success(new SystemStatus("UP"));
    }

    public record SystemStatus(String status) {
    }
}
