package com.meetu.backend.search.controller;

import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.search.dto.SearchResult;
import com.meetu.backend.search.service.SearchService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final SearchService search;
    public SearchController(SearchService search) { this.search=search; }
    @GetMapping public ApiResponse<SearchResult> search(Authentication auth,@RequestParam(required=false) String q) {
        return ApiResponse.success("Search results",search.search(auth.getName(),q));
    }
}
