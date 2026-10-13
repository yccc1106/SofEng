package com.meetu.backend.interest.service;

import com.meetu.backend.interest.dto.CategoryDto;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    List<CategoryDto> list();
    Optional<CategoryDto> get(String id);
}
