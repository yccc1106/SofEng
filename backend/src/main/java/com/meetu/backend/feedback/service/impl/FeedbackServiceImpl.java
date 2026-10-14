package com.meetu.backend.feedback.service.impl;

import com.meetu.backend.admin.mapper.AuditMapper;
import com.meetu.backend.admin.service.ManagementException;
import com.meetu.backend.feedback.dto.FeedbackDtos.*;
import com.meetu.backend.feedback.mapper.FeedbackMapper;
import com.meetu.backend.feedback.service.FeedbackService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class FeedbackServiceImpl implements FeedbackService {
    private final FeedbackMapper mapper;
    private final AuditMapper audit;
    public FeedbackServiceImpl(FeedbackMapper mapper,AuditMapper audit) { this.mapper=mapper; this.audit=audit; }
    private static String val(Map<String,Object> row,String key) { Object value=row.get(key); return value==null?null:value.toString(); }
    private static Map<String,Object> display(Map<String,Object> row) {
        Map<String,Object> result=new LinkedHashMap<>(row);
        result.put("user",Objects.toString(row.get("userName"),"Anonymous"));
        result.put("suggestion",row.get("content"));
        result.put("date",row.get("date"));
        String type=val(row,"reportType");
        Map<String,Object> target=null;
        if ("USER".equals(type)) target=Map.of("id",val(row,"reportedUserId"),"name",Objects.toString(row.get("targetUserName"),""),"status",Objects.toString(row.get("targetUserStatus"),""));
        if ("POST".equals(type)) target=Map.of("id",val(row,"reportedPostId"),"title",Objects.toString(row.get("targetPostTitle"),""),"status",Objects.toString(row.get("targetPostStatus"),""));
        if ("MESSAGE".equals(type)) target=Map.of("id",val(row,"reportedMessageId"),"content",Objects.toString(row.get("targetMessageContent"),""));
        result.put("target",target);
        return result;
    }
    @Override @Transactional
    public Map<String,Object> submit(String user,Submit request) {
        String type=request.type()==null?"SUGGESTION":request.type();
        if (!Set.of("SUGGESTION","REPORT","OTHER").contains(type)) throw ManagementException.invalid("Invalid feedback type");
        String reportType=request.reportType();
        String targetUser=request.reportedUserId(),targetPost=request.reportedPostId(),targetMessage=request.reportedMessageId();
        if ("REPORT".equals(type)) {
            if (reportType==null || !Set.of("USER","POST","MESSAGE").contains(reportType)) throw ManagementException.invalid("Report target type required");
            int count=(targetUser!=null?1:0)+(targetPost!=null?1:0)+(targetMessage!=null?1:0);
            if (count!=1 || ("USER".equals(reportType) && targetUser==null) || ("POST".equals(reportType) && targetPost==null) || ("MESSAGE".equals(reportType) && targetMessage==null))
                throw ManagementException.invalid("Report target mismatch");
            if (targetUser!=null && mapper.activeUser(targetUser)==null || targetPost!=null && mapper.activePost(targetPost)==null || targetMessage!=null && mapper.visibleMessage(targetMessage,user)==null)
                throw ManagementException.missing("Report target not found");
            if (user.equals(targetUser)) throw ManagementException.invalid("Cannot report yourself");
        } else if (reportType!=null || targetUser!=null || targetPost!=null || targetMessage!=null) throw ManagementException.invalid("Only reports can have a target");
        String id=UUID.randomUUID().toString();
        mapper.insert(id,user,request.content().trim(),type,reportType,targetUser,targetPost,targetMessage,request.contact(),request.images()==null?new String[0]:request.images());
        return display(mapper.lock(id));
    }
    @Override public List<Map<String,Object>> mine(String user) {
        return mapper.mine(user).stream().map(row -> {
            Map<String,Object> result=new LinkedHashMap<>();
            for (String key : List.of("id","content","type","status","reportType","createdAt","handledAt","handleNote"))
                result.put(key,row.get(key));
            return result;
        }).toList();
    }
    @Override public List<Map<String,Object>> all(String type) {
        if (type!=null && !Set.of("SUGGESTION","REPORT","OTHER").contains(type)) throw ManagementException.invalid("Invalid feedback type");
        return mapper.all(type).stream().map(FeedbackServiceImpl::display).toList();
    }
    @Override @Transactional
    public void handle(String admin,Handle request) {
        Map<String,Object> row=mapper.lock(request.id());
        if (row==null) throw ManagementException.missing("Feedback not found");
        if (!"PENDING".equals(row.get("status"))) throw ManagementException.conflict("Feedback already handled");
        String type=val(row,"type"),action=request.action(),status=request.status();
        if ("SUGGESTION".equals(type) || "OTHER".equals(type)) {
            if (!Set.of("ADOPTED","IGNORED","PROCESSED").contains(status) || action!=null) throw ManagementException.invalid("Invalid suggestion decision");
        } else {
            if (!Set.of("RESOLVED","IGNORED").contains(status)) throw ManagementException.invalid("Invalid report decision");
            if ("IGNORED".equals(status) && !"IGNORE".equals(action) || "RESOLVED".equals(status) && (action==null || !Set.of("BAN_USER","DELETE_POST","DELETE_MESSAGE","RESOLVE","WARN_USER").contains(action)))
                throw ManagementException.invalid("Invalid report action");
            String targetType=val(row,"reportType");
            if ("BAN_USER".equals(action)) {
                if (!"USER".equals(targetType) || mapper.banUser(val(row,"reportedUserId"))!=1) throw ManagementException.conflict("User cannot be banned");
                audit.record(admin,"USER",val(row,"reportedUserId"),"BAN_USER",request.note());
            } else if ("DELETE_POST".equals(action)) {
                if (!"POST".equals(targetType) || mapper.deletePost(val(row,"reportedPostId"))!=1) throw ManagementException.conflict("Post cannot be removed");
                audit.record(admin,"POST",val(row,"reportedPostId"),"DELETE_POST",request.note());
            } else if ("DELETE_MESSAGE".equals(action)) {
                if (!"MESSAGE".equals(targetType) || mapper.blockMessage(val(row,"reportedMessageId"))!=1) throw ManagementException.conflict("Message cannot be blocked");
                audit.record(admin,"MESSAGE",val(row,"reportedMessageId"),"BLOCK_MESSAGE",request.note());
            } else if ("WARN_USER".equals(action) && (!"USER".equals(targetType) || request.note()==null || request.note().isBlank()))
                throw ManagementException.invalid("Warning requires a user and note");
        }
        if (mapper.handle(request.id(),status,admin,request.note())!=1) throw ManagementException.conflict("Feedback already handled");
        audit.record(admin,"FEEDBACK",request.id(),action==null?status:action,request.note());
    }
}
