package com.meetu.backend.user.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.user.dto.PersonalityDtos;
import com.meetu.backend.user.service.PersonalityService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PersonalityController {
    private final PersonalityService service;
    public PersonalityController(PersonalityService service) { this.service=service; }
    @PostMapping("/personality-test") public ApiResponse<PersonalityDtos.Result> save(Authentication auth,@RequestBody PersonalityDtos.Answers request) {
        return ApiResponse.success("Personality test result saved",service.save(auth.getName(),request));
    }
    @GetMapping("/radar") public ApiResponse<List<PersonalityDtos.Match>> matches(Authentication auth) {
        return ApiResponse.success("Radar matches found",service.matches(auth.getName()));
    }
}
