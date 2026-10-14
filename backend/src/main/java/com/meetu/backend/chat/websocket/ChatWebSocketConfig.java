package com.meetu.backend.chat.websocket;

import com.meetu.backend.chat.mapper.ChatMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;
import java.util.Map;

/** WebSocket 握手沿用 Java 登录会话，并限制允许连接的前端来源。 */
@Configuration
@EnableWebSocket
public class ChatWebSocketConfig implements WebSocketConfigurer {
    private final ChatWebSocketHandler handler;
    private final ChatMapper mapper;
    private final String frontendOrigin;
    public ChatWebSocketConfig(ChatWebSocketHandler handler,ChatMapper mapper,
            @Value("${meetu.frontend-origin:http://localhost:3000}") String frontendOrigin) {
        this.handler=handler; this.mapper=mapper; this.frontendOrigin=frontendOrigin;
    }
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler,"/api/chat/ws").setAllowedOrigins(frontendOrigin).addInterceptors(new HandshakeInterceptor() {
            @Override public boolean beforeHandshake(ServerHttpRequest request,ServerHttpResponse response,
                    org.springframework.web.socket.WebSocketHandler wsHandler,Map<String,Object> attributes) {
                if (!(request instanceof ServletServerHttpRequest servlet)) return false;
                HttpSession session=servlet.getServletRequest().getSession(false);
                if (session==null) return false;
                Object stored=session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
                if (!(stored instanceof SecurityContext context)) return false;
                Authentication auth=context.getAuthentication();
                if (auth==null || !auth.isAuthenticated() || mapper.activeUser(auth.getName())==null) return false;
                attributes.put("userId",auth.getName());
                attributes.put("httpSession",session);
                return true;
            }
            @Override public void afterHandshake(ServerHttpRequest request,ServerHttpResponse response,
                    org.springframework.web.socket.WebSocketHandler wsHandler,Exception exception) {}
        });
    }
}
