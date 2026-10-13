package com.meetu.backend.post.mapper;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class StringArrayTypeHandler extends BaseTypeHandler<String[]> {
    @Override
    public void setNonNullParameter(PreparedStatement statement, int index, String[] parameter, JdbcType jdbcType)
            throws SQLException {
        statement.setArray(index, statement.getConnection().createArrayOf("text", parameter));
    }

    @Override public String[] getNullableResult(ResultSet result, String column) throws SQLException {
        var value = result.getArray(column);
        return value == null ? null : (String[]) value.getArray();
    }
    @Override public String[] getNullableResult(ResultSet result, int index) throws SQLException {
        var value = result.getArray(index);
        return value == null ? null : (String[]) value.getArray();
    }
    @Override public String[] getNullableResult(CallableStatement statement, int index) throws SQLException {
        var value = statement.getArray(index);
        return value == null ? null : (String[]) value.getArray();
    }
}
