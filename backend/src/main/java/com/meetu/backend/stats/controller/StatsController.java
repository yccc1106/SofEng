package com.meetu.backend.stats.controller;
import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.stats.dto.StatsDtos;
import com.meetu.backend.stats.service.StatsService;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/admin/stats")
public class StatsController {
    private final StatsService service;
    public StatsController(StatsService service) { this.service=service; }
    @GetMapping public ApiResponse<StatsDtos.Dashboard> get() { return ApiResponse.success("Stats retrieved",service.dashboard()); }
}
