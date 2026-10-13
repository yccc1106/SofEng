package com.meetu.backend.interest.service.impl;

import com.meetu.backend.interest.dto.CategoryDto;
import com.meetu.backend.interest.mapper.CategoryMapper;
import com.meetu.backend.interest.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements CategoryService {
    private final CategoryMapper categories;

    public CategoryServiceImpl(CategoryMapper categories) { this.categories = categories; }

    @Override public List<CategoryDto> list() { return categories.findAll(); }
    @Override public Optional<CategoryDto> get(String id) { return categories.findById(id); }
}
