package com.meetu.backend.moderation.service.impl;
import com.meetu.backend.admin.mapper.AuditMapper;
import com.meetu.backend.admin.service.ManagementException;
import com.meetu.backend.moderation.dto.ModerationDtos.Decision;
import com.meetu.backend.moderation.mapper.ModerationMapper;
import com.meetu.backend.moderation.service.ModerationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service
public class ModerationServiceImpl implements ModerationService {
    private final ModerationMapper mapper;
    private final AuditMapper audit;
    public ModerationServiceImpl(ModerationMapper mapper,AuditMapper audit) { this.mapper=mapper; this.audit=audit; }
    @Override public List<Map<String,Object>> posts(String status) {
        if (status!=null && !Set.of("pending","approved","rejected").contains(status)) throw ManagementException.invalid("Invalid post status");
        return mapper.posts(status).stream().map(row -> { Map<String,Object> result=new LinkedHashMap<>(row); String s=(String)row.get("status"); result.put("status","AUDITING".equals(s)?"pending":"PUBLISHED".equals(s)?"approved":"rejected"); return result; }).toList();
    }
    @Override @Transactional public void decidePost(String admin,Decision decision) {
        if (!Set.of("pass","reject").contains(decision.action())) throw ManagementException.invalid("Invalid post action");
        String status=mapper.lockPost(decision.id());
        if (status==null) throw ManagementException.missing("Post not found");
        if (!"AUDITING".equals(status)) throw ManagementException.conflict("Post is not pending review");
        mapper.decidePost(decision.id(),"pass".equals(decision.action())?"PUBLISHED":"REJECTED");
        audit.record(admin,"POST",decision.id(),decision.action(),decision.note());
    }
    @Override public List<Map<String,Object>> chats() {
        return mapper.chats().stream().map(row -> { Map<String,Object> result=new LinkedHashMap<>(row); result.put("receiver",Objects.toString(row.get("receiver"),"Group/Team")); result.put("riskLevel","unknown"); if ("BLOCKED".equals(row.get("moderationStatus"))) result.put("content","[已屏蔽]"); return result; }).toList();
    }
    @Override @Transactional public void blockChat(String admin,String id) {
        if (id==null || id.isBlank()) throw ManagementException.invalid("ID required");
        if (mapper.blockChat(id)!=1) throw ManagementException.conflict("Message is unavailable or already blocked");
        audit.record(admin,"MESSAGE",id,"BLOCK_MESSAGE",null);
    }
    @Override public List<Map<String,Object>> rooms() {
        return mapper.rooms().stream().map(row -> { Map<String,Object> result=new LinkedHashMap<>(row); result.put("status",((String)row.get("status")).toLowerCase(Locale.ROOT)); return result; }).toList();
    }
    @Override @Transactional public void closeRoom(String admin,Decision decision) {
        if (!"close".equals(decision.action())) throw ManagementException.invalid("Invalid room action");
        if (mapper.closeRoom(decision.id())!=1) throw ManagementException.conflict("Room is unavailable or already closed");
        audit.record(admin,"TEAM",decision.id(),"CLOSE",decision.note());
    }
}
