package com.meetu.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetu.backend.common.api.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/** 对登录和注册按客户端地址分别限流，避免单个来源连续尝试。 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper mapper;
    private final String trustedProxyAddress;

    public AuthRateLimitFilter(ObjectMapper mapper,
                               @Value("${meetu.trusted-proxy-address:}") String trustedProxyAddress) {
        this.mapper = mapper;
        this.trustedProxyAddress = trustedProxyAddress;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!"POST".equals(request.getMethod()) ||
                !("/api/auth/login".equals(path) || "/api/users".equals(path))) {
            chain.doFilter(request, response);
            return;
        }
        boolean login = "/api/auth/login".equals(path);
        long period = login ? Duration.ofMinutes(5).toMillis() : Duration.ofHours(1).toMillis();
        int limit = login ? 10 : 5;
        long now = System.currentTimeMillis();
        String key = path + ':' + clientAddress(request);
        Window current = windows.compute(key, (ignored, old) ->
                old == null || now - old.startedAt >= period ? new Window(now, 1)
                        : new Window(old.startedAt, old.count + 1));
        if (windows.size() > 10_000) windows.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= Duration.ofHours(1).toMillis());
        if (current.count > limit) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", Long.toString(Math.max(1, (period - (now - current.startedAt) + 999) / 1000)));
            mapper.writeValue(response.getOutputStream(), ApiResponse.error("Too many requests"));
            return;
        }
        chain.doFilter(request, response);
    }

    private record Window(long startedAt, int count) {}

    /** 仅在请求确实来自配置的可信代理时读取其转发地址。 */
    private String clientAddress(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (!remote.equals(trustedProxyAddress)) return remote;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null) return remote;
        String first = forwarded.split(",", 2)[0].trim();
        if (!first.matches("[0-9a-fA-F:.]+")) return remote;
        try { return InetAddress.getByName(first).getHostAddress(); }
        catch (UnknownHostException exception) { return remote; }
    }
}
