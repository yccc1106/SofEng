package com.meetu.backend.team.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.team.dto.TeamDtos;
import com.meetu.backend.team.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** 提供队伍查询、创建和申请审批接口；业务约束由 TeamService 执行。 */
@RestController
@RequestMapping("/api/teams")
public class TeamController {
    private final TeamService teams;
    public TeamController(TeamService teams) { this.teams=teams; }
    @GetMapping public ApiResponse<List<TeamDtos.Team>> list(Authentication auth,
            @RequestParam(defaultValue="false") boolean mine,@RequestParam(required=false) String type,
            @RequestParam(required=false) String categoryId) {
        String viewer=auth==null || "anonymousUser".equals(auth.getPrincipal()) ? null : auth.getName();
        return ApiResponse.success("Teams retrieved",teams.list(viewer,mine,type,categoryId));
    }
    @PostMapping public ResponseEntity<ApiResponse<TeamDtos.Team>> create(Authentication auth,@Valid @RequestBody TeamDtos.Create input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Team created",teams.create(auth.getName(),input)));
    }
    @PostMapping("/join") public ApiResponse<TeamDtos.Member> join(Authentication auth,@Valid @RequestBody TeamDtos.Join input) {
        var result=teams.join(auth.getName(),input);
        return ApiResponse.success("PENDING".equals(result.status()) ? "Application sent successfully" : "Joined team successfully",result);
    }
    @GetMapping("/requests") public ApiResponse<List<TeamDtos.Member>> requests(Authentication auth) {
        return ApiResponse.success("Requests retrieved",teams.requests(auth.getName()));
    }
    @PatchMapping("/requests") public ApiResponse<TeamDtos.Member> decide(Authentication auth,@Valid @RequestBody TeamDtos.Decision input) {
        return ApiResponse.success("Request processed",teams.decide(auth.getName(),input));
    }
}
