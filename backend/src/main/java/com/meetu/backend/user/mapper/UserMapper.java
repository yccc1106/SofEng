package com.meetu.backend.user.mapper;

import com.meetu.backend.user.entity.UserEntity;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.sql.Array;
import java.sql.SQLException;
import java.util.Map;
import java.util.Optional;

@Mapper
public interface UserMapper {
    String FIELDS = "\"id\", \"name\", \"email\", \"password\", \"image\", " +
            "CAST(\"role\" AS VARCHAR) AS role, \"status\", \"studentId\", \"school\", " +
            "\"major\", \"grade\", \"bio\", CAST(\"gender\" AS VARCHAR) AS gender, " +
            "\"personalityType\", \"personalityTags\", \"verificationStatus\"";

    @Select("SELECT " + FIELDS + " FROM \"User\" WHERE LOWER(\"email\")=LOWER(#{email})")
    Map<String, Object> selectByEmail(String email);

    @Select("SELECT " + FIELDS + " FROM \"User\" WHERE id=#{id}")
    Map<String, Object> selectById(String id);

    @Insert("INSERT INTO \"User\" (id,name,email,password,\"studentId\",school,\"createdAt\",\"updatedAt\",\"personalityTags\") " +
            "VALUES (#{id},#{name},#{email},#{password},#{studentId},#{school},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,ARRAY[]::text[])")
    int insert(@Param("id") String id, @Param("name") String name, @Param("email") String email,
               @Param("password") String password, @Param("studentId") String studentId,
               @Param("school") String school);

    @Update("UPDATE \"User\" SET name=#{name},school=#{school},major=#{major},grade=#{grade},bio=#{bio}," +
            "\"updatedAt\"=CURRENT_TIMESTAMP WHERE id=#{id}")
    int updateProfile(@Param("id") String id, @Param("name") String name, @Param("school") String school,
                      @Param("major") String major, @Param("grade") String grade, @Param("bio") String bio);

    default Optional<UserEntity> findByEmail(String email) { return Optional.ofNullable(map(selectByEmail(email))); }
    default Optional<UserEntity> findById(String id) { return Optional.ofNullable(map(selectById(id))); }

    private static String string(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? null : value.toString();
    }

    private static UserEntity map(Map<String, Object> row) {
        if (row == null) return null;
        String[] tags = new String[0];
        Object value = row.get("personalityTags");
        try {
            if (value instanceof Array array) tags = (String[]) array.getArray();
            else if (value instanceof String[] strings) tags = strings;
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not read personality tags", exception);
        }
        return new UserEntity(string(row,"id"), string(row,"name"), string(row,"email"),
                string(row,"password"), string(row,"image"), string(row,"role"), string(row,"status"),
                string(row,"studentId"), string(row,"school"), string(row,"major"), string(row,"grade"),
                string(row,"bio"), string(row,"gender"), string(row,"personalityType"), tags,
                string(row,"verificationStatus"));
    }
}
