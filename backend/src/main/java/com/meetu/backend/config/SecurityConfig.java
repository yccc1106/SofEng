package com.meetu.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetu.backend.common.api.ApiResponse;
import com.meetu.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
public class SecurityConfig {
    private static final String[] PUBLIC = {
            "/api/system/ping", "/actuator/health", "/actuator/health/**",
            "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**"
    };

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, UserRepository users, ObjectMapper mapper,
                                            @Value("${meetu.frontend-origin:http://localhost:3000}") String frontendOrigin) throws Exception {
        var contextRepository = new HttpSessionSecurityContextRepository();
        return http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .requestCache(cache -> cache.disable())
                .securityContext(context -> context.securityContextRepository(contextRepository))
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                                    jakarta.servlet.FilterChain chain) throws jakarta.servlet.ServletException, IOException {
                        String method = request.getMethod();
                        if (!method.equals("GET") && !method.equals("HEAD") && !method.equals("OPTIONS")) {
                            String origin = request.getHeader("Origin");
                            String fetchSite = request.getHeader("Sec-Fetch-Site");
                            if ((origin != null && !origin.equals(frontendOrigin)) || "cross-site".equals(fetchSite)) {
                                writeError(response, mapper, 403, "Forbidden origin");
                                return;
                            }
                        }
                        chain.doFilter(request, response);
                    }
                }, AnonymousAuthenticationFilter.class)
                .addFilterBefore(new OncePerRequestFilter() {
                    @Override
                    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                                    jakarta.servlet.FilterChain chain) throws jakarta.servlet.ServletException, IOException {
                        // The Java session is checked against the database on every request, so a frozen,
                        // banned, deleted, or demoted account loses access immediately.
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        if (authentication != null && authentication.isAuthenticated()
                                && !(authentication.getPrincipal() instanceof String principal && "anonymousUser".equals(principal))) {
                            String id = authentication.getName();
                            var user = users.findById(id);
                            if (user.isEmpty() || !"ACTIVE".equals(user.get().status())) {
                                SecurityContextHolder.clearContext();
                                var session = request.getSession(false);
                                if (session != null) session.invalidate();
                            } else {
                                String role = user.get().role();
                                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                                        id, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
                            }
                        }
                        chain.doFilter(request, response);
                    }
                }, AnonymousAuthenticationFilter.class)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(PUBLIC).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users", "/api/auth/login").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/profile").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/users/profile").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/auth/logout").authenticated()
                        .anyRequest().denyAll())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> writeError(response, mapper, 401, "Unauthorized"))
                        .accessDeniedHandler((request, response, exception) -> writeError(response, mapper, 403, "Forbidden")))
                .build();
    }

    private static void writeError(HttpServletResponse response, ObjectMapper mapper, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), ApiResponse.error(message));
    }
}
