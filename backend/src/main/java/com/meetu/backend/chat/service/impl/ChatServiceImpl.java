package com.meetu.backend.chat.service.impl;

import com.meetu.backend.chat.dto.ChatDtos;
import com.meetu.backend.chat.mapper.ChatMapper;
import com.meetu.backend.chat.service.ChatService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** 统一处理三类会话的访问权限、消息历史及已读状态。 */
@Service
public class ChatServiceImpl implements ChatService {
    private final ChatMapper mapper;
    private final ApplicationEventPublisher events;
    public ChatServiceImpl(ChatMapper mapper,ApplicationEventPublisher events) { this.mapper=mapper; this.events=events; }

    /** REST 与 WebSocket 共用的会话权限检查；请求只能指定一个目标。 */
    @Override public String authorize(String viewer,ChatDtos.Target target) {
        if (viewer==null || mapper.activeUser(viewer)==null) throw new ChatForbidden();
        int targets=(present(target.userId()) ? 1 : 0)+(present(target.teamId()) ? 1 : 0)
                +(present(target.categoryId()) ? 1 : 0);
        if (targets!=1) throw new InvalidChatRequest("Exactly one conversation target is required");
        if (present(target.userId())) {
            if (viewer.equals(target.userId()) || mapper.activeUser(target.userId())==null ||
                    mapper.friendship(viewer,target.userId())==null) throw new ChatForbidden();
            return "USER:"+target.userId();
        }
        if (present(target.teamId())) {
            if (mapper.activeTeam(target.teamId())==null || mapper.joined(target.teamId(),viewer)==null)
                throw new ChatForbidden();
            return "TEAM:"+target.teamId();
        }
        if (mapper.categoryExists(target.categoryId())==null) throw new ChatNotFound();
        return "CATEGORY:"+target.categoryId();
    }

    @Override public List<ChatDtos.Contact> contacts(String userId) {
        var result=new ArrayList<ChatDtos.Contact>();
        for (var row:mapper.contacts(userId)) {
            String type=s(row,"type"),id=s(row,"id");
            result.add(new ChatDtos.Contact(id,s(row,"name"),s(row,"image"),type,s(row,"subType"),
                    mapper.unread(userId,type,id)));
        }
        return result;
    }

    /** 取最近一页消息；游标必须属于当前会话，结果按时间正序展示。 */
    @Override public List<ChatDtos.Message> history(String userId,ChatDtos.Target target,String before) {
        authorize(userId,target);
        Object beforeTime=null;
        if (present(before)) {
            var cursor=mapper.cursor(before);
            if (cursor==null || !belongs(cursor,userId,target)) throw new InvalidChatRequest("Invalid history cursor");
            beforeTime=cursor.get("createdAt");
        }
        List<Map<String,Object>> rows=present(target.userId()) ? mapper.direct(userId,target.userId(),beforeTime,before) :
                present(target.teamId()) ? mapper.team(target.teamId(),beforeTime,before) :
                        mapper.category(target.categoryId(),beforeTime,before);
        var result=new ArrayList<ChatDtos.Message>();
        for (int i=rows.size()-1;i>=0;i--) result.add(message(rows.get(i)));
        return result;
    }

    /** 消息先写入数据库，再发布供 WebSocket 在事务提交后推送的事件。 */
    @Override @Transactional public ChatDtos.Message send(String userId,ChatDtos.Send input) {
        var target=new ChatDtos.Target(input.receiverId(),input.teamId(),input.categoryId());
        authorize(userId,target);
        String content=input.content()==null ? "" : input.content().trim();
        if (content.isEmpty() || content.length()>4000) throw new InvalidChatRequest("Message must contain 1 to 4000 characters");
        String type=input.type()==null || input.type().isBlank() ? "TEXT" : input.type().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("TEXT","IMAGE").contains(type)) throw new InvalidChatRequest("Only TEXT and IMAGE messages are supported");
        if ("IMAGE".equals(type) && !content.startsWith("/java/uploads/chat/"))
            throw new InvalidChatRequest("Image messages must use an uploaded local image");
        String id=UUID.randomUUID().toString();
        mapper.insert(id,content,type,userId,target.userId(),target.teamId(),target.categoryId());
        var saved=message(mapper.message(id));
        events.publishEvent(new MessageSaved(target,saved));
        return saved;
    }

    @Override @Transactional public void markRead(String userId,ChatDtos.Target target) {
        String key=authorize(userId,target);
        String[] parts=key.split(":",2);
        mapper.upsertRead(userId,parts[0],parts[1]);
        if (present(target.userId())) mapper.markDirectRead(userId,target.userId());
        events.publishEvent(new ConversationRead(userId,target));
    }

    private static boolean belongs(Map<String,Object> row,String viewer,ChatDtos.Target target) {
        if (present(target.userId())) return
                (viewer.equals(s(row,"senderId")) && target.userId().equals(s(row,"receiverId"))) ||
                (target.userId().equals(s(row,"senderId")) && viewer.equals(s(row,"receiverId")));
        if (present(target.teamId())) return target.teamId().equals(s(row,"teamId"));
        return target.categoryId().equals(s(row,"categoryId"));
    }
    private static ChatDtos.Message message(Map<String,Object> r) {
        return new ChatDtos.Message(s(r,"id"),s(r,"content"),s(r,"type"),s(r,"senderId"),
                s(r,"receiverId"),s(r,"teamId"),s(r,"categoryId"),Boolean.TRUE.equals(r.get("isRead")),
                instant(r.get("createdAt")),new ChatDtos.Sender(s(r,"senderUserId"),s(r,"senderName"),s(r,"senderImage")));
    }
    private static String s(Map<String,Object> r,String key) { return r.get(key)==null ? null : r.get(key).toString(); }
    private static boolean present(String value) { return value!=null && !value.isBlank(); }
    private static Instant instant(Object value) { return value instanceof Timestamp t ? t.toInstant() : (Instant)value; }
    public static class InvalidChatRequest extends RuntimeException { public InvalidChatRequest(String message) { super(message); } }
    public static class ChatForbidden extends RuntimeException {}
    public static class ChatNotFound extends RuntimeException {}
    public record MessageSaved(ChatDtos.Target target,ChatDtos.Message message) {}
    public record ConversationRead(String readerId,ChatDtos.Target target) {}
}
