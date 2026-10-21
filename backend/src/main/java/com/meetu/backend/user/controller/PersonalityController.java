package com.meetu.backend.user.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.radar.RadarCoordinator;
import com.meetu.backend.radar.RadarDtos;
import com.meetu.backend.user.dto.PersonalityDtos;
import com.meetu.backend.user.service.PersonalityService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PersonalityController {
    private final PersonalityService service;
    private final RadarCoordinator radar;
    public PersonalityController(PersonalityService service, RadarCoordinator radar) {
        this.service=service;
        this.radar=radar;
    }
    @PostMapping("/personality-test") public ApiResponse<PersonalityDtos.Result> save(Authentication auth,@RequestBody PersonalityDtos.Answers request) {
        return ApiResponse.success("Personality test result saved",service.save(auth.getName(),request));
    }
    @GetMapping("/radar") public ApiResponse<RadarDtos.Result> matches(Authentication auth,
                                                                        @RequestParam(required=false) String q) {
        String query=q==null ? "" : q.trim();
        if (query.length()>160) query=query.substring(0,160);
        return ApiResponse.success("Radar matches found",radar.recommend(auth.getName(),query));
    }
}
