package com.meetu.backend.admin.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.UUID;

@Mapper
public interface AuditMapper {
    @Insert("INSERT INTO \"ManagementAudit\" (id,\"actorId\",\"targetType\",\"targetId\",action,note) VALUES (#{id},#{actor},#{type},#{target},#{action},#{note})")
    int insert(@Param("id") String id,@Param("actor") String actor,@Param("type") String type,
               @Param("target") String target,@Param("action") String action,@Param("note") String note);
    default void record(String actor,String type,String target,String action,String note) {
        insert(UUID.randomUUID().toString(),actor,type,target,action,note);
    }
}
