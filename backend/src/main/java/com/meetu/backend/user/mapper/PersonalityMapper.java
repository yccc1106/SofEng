package com.meetu.backend.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import java.util.List;
import java.util.Map;

@Mapper
public interface PersonalityMapper {
    @Update("UPDATE \"User\" SET \"personalityType\"=#{type},\"personalityTags\"=#{tags,typeHandler=com.meetu.backend.post.mapper.StringArrayTypeHandler}," +
            "\"updatedAt\"=CURRENT_TIMESTAMP AT TIME ZONE 'UTC' WHERE id=#{id} AND status='ACTIVE'")
    int save(@Param("id") String id, @Param("type") String type, @Param("tags") String[] tags);

    @Select("SELECT id,name,image,school,bio,\"personalityType\",\"personalityTags\" FROM \"User\" " +
            "WHERE status='ACTIVE' AND CAST(role AS varchar)='USER' AND id<>#{viewer} AND \"personalityType\" IS NOT NULL ORDER BY id")
    List<Map<String,Object>> candidates(String viewer);
}
