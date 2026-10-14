package com.meetu.backend.chat.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetu.backend.chat.dto.ChatDtos;
import com.meetu.backend.chat.service.ChatService;
import com.meetu.backend.chat.service.impl.ChatServiceImpl.ConversationRead;
import com.meetu.backend.chat.service.impl.ChatServiceImpl.MessageSaved;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** 维护单实例内的会话订阅，并在发送前重新核验连接和会话权限。 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {
    private final ChatService chat;
    private final ObjectMapper json;
    private final Map<String,WebSocketSession> sessions=new ConcurrentHashMap<>();
    private final Map<String,Set<String>> rooms=new ConcurrentHashMap<>();
    public ChatWebSocketHandler(ChatService chat,ObjectMapper json) { this.chat=chat; this.json=json; }

    @Override public void afterConnectionEstablished(WebSocketSession session) {
        session.setTextMessageSizeLimit(8192);
        sessions.put(session.getId(),session);
        rooms.put(session.getId(),ConcurrentHashMap.newKeySet());
    }
    @Override protected void handleTextMessage(WebSocketSession session,TextMessage text) throws Exception {
        try {
            if (!authenticated(session)) { session.close(CloseStatus.POLICY_VIOLATION); return; }
            JsonNode node=json.readTree(text.getPayload());
            String event=node.path("event").asText();
            if ("ping".equals(event)) {
                send(session,Map.of("event","pong")); return;
            }
            ChatDtos.Target target=new ChatDtos.Target(value(node,"userId"),value(node,"teamId"),value(node,"categoryId"));
            String userId=(String)session.getAttributes().get("userId");
            String room=room(userId,target);
            if ("join".equals(event)) {
                chat.authorize(userId,target);
                rooms.get(session.getId()).add(room);
                send(session,Map.of("event","joined","room",room));
            } else if ("leave".equals(event)) {
                rooms.get(session.getId()).remove(room);
            } else {
                send(session,Map.of("event","error","message","Unknown event"));
            }
        } catch (RuntimeException exception) {
            send(session,Map.of("event","error","message","Invalid or unauthorized conversation"));
        }
    }
    @Override public void afterConnectionClosed(WebSocketSession session,CloseStatus status) {
        sessions.remove(session.getId()); rooms.remove(session.getId());
    }
    @Override public void handleTransportError(WebSocketSession session,Throwable exception) throws Exception {
        session.close(CloseStatus.SERVER_ERROR);
    }

    // 事务提交后才广播，避免客户端收到最终回滚的消息。
    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    public void onMessage(MessageSaved event) {
        var message=event.message();
        String room=message.receiverId()!=null ? directRoom(message.senderId(),message.receiverId()) :
                message.teamId()!=null ? "team:"+message.teamId() : "interest:"+message.categoryId();
        publish(room,event.target(),Map.of("event","new:message","data",message));
    }
    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    public void onRead(ConversationRead event) {
        if (event.target().userId()==null) return;
        String room=directRoom(event.readerId(),event.target().userId());
        publish(room,event.target(),Map.of("event","read","readerId",event.readerId()));
    }
    /** 推送前复查账号与会话权限，及时移除失效订阅。 */
    private void publish(String room,ChatDtos.Target target,Object payload) {
        for (var entry:sessions.entrySet()) {
            String userId=(String)entry.getValue().getAttributes().get("userId");
            if (!rooms.getOrDefault(entry.getKey(),Set.of()).contains(room)) continue;
            try {
                if (!authenticated(entry.getValue())) {
                    entry.getValue().close(CloseStatus.POLICY_VIOLATION);
                    continue;
                }
                chat.authorize(userId,recipientTarget(userId,target,room));
                send(entry.getValue(),payload);
            } catch (RuntimeException | IOException exception) {
                Set<String> subscriptions=rooms.get(entry.getKey());
                if (subscriptions!=null) subscriptions.remove(room);
            }
        }
    }
    private static ChatDtos.Target recipientTarget(String userId,ChatDtos.Target target,String room) {
        if (!room.startsWith("dm:")) return target;
        String[] ids=room.substring(3).split("_",2);
        return new ChatDtos.Target(userId.equals(ids[0]) ? ids[1] : ids[0],null,null);
    }
    private static String room(String userId,ChatDtos.Target target) {
        if (target.userId()!=null) return directRoom(userId,target.userId());
        if (target.teamId()!=null) return "team:"+target.teamId();
        if (target.categoryId()!=null) return "interest:"+target.categoryId();
        throw new IllegalArgumentException("Missing target");
    }
    private static String directRoom(String a,String b) { return a.compareTo(b)<0 ? "dm:"+a+"_"+b : "dm:"+b+"_"+a; }
    private static String value(JsonNode node,String key) {
        JsonNode value=node.get(key); return value==null || value.isNull() ? null : value.asText();
    }
    private static boolean authenticated(WebSocketSession session) {
        Object value=session.getAttributes().get("httpSession");
        if (!(value instanceof HttpSession httpSession)) return false;
        try {
            Object stored=httpSession.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
            return stored instanceof SecurityContext context && context.getAuthentication()!=null &&
                    context.getAuthentication().isAuthenticated() &&
                    session.getAttributes().get("userId").equals(context.getAuthentication().getName());
        } catch (IllegalStateException exception) { return false; }
    }
    private void send(WebSocketSession session,Object payload) throws IOException {
        if (!session.isOpen()) return;
        synchronized (session) { session.sendMessage(new TextMessage(json.writeValueAsString(payload))); }
    }
}
