package com.meetu.backend.interest.mapper;

import com.meetu.backend.interest.dto.CategoryDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Mapper
public interface CategoryMapper {
    String FIELDS = "id,name,\"parentId\",description,\"usageCount\"";

    @Select("SELECT " + FIELDS + " FROM \"Category\" ORDER BY \"usageCount\" DESC,name ASC")
    List<Map<String, Object>> selectAll();

    @Select("SELECT " + FIELDS + " FROM \"Category\" WHERE id=#{id}")
    Map<String, Object> selectById(String id);

    default List<CategoryDto> findAll() { return selectAll().stream().map(CategoryMapper::map).toList(); }
    default Optional<CategoryDto> findById(String id) { return Optional.ofNullable(selectById(id)).map(CategoryMapper::map); }

    private static CategoryDto map(Map<String, Object> row) {
        return new CategoryDto((String) row.get("id"), (String) row.get("name"),
                (String) row.get("parentId"), (String) row.get("description"),
                ((Number) row.get("usageCount")).intValue());
    }
}
