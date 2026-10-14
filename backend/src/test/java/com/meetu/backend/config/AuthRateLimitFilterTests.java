package com.meetu.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRateLimitFilterTests {
    @Test
    void loginIsLimitedBySocketAddressEvenWhenForwardedHeaderChanges() throws Exception {
        var filter = new AuthRateLimitFilter(new ObjectMapper(), "");
        for (int attempt = 1; attempt <= 11; attempt++) {
            var request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("192.0.2.7");
            request.addHeader("X-Forwarded-For", "192.0.2." + attempt);
            var response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(attempt <= 10 ? 200 : 429, response.getStatus());
            if (attempt == 11) {
                assertTrue(response.getHeader("Retry-After") != null);
                assertTrue(response.getContentAsString().contains("Too many requests"));
            }
        }
    }

    @Test
    void configuredProxyUsesValidatedForwardedClientAddress() throws Exception {
        var filter = new AuthRateLimitFilter(new ObjectMapper(), "127.0.0.1");
        for (int attempt = 1; attempt <= 11; attempt++) {
            var request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("127.0.0.1");
            request.addHeader("X-Forwarded-For", attempt <= 10 ? "192.0.2.7" : "192.0.2.8");
            var response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(200, response.getStatus());
        }
    }

    @Test
    void registrationHasItsOwnHourlyLimit() throws Exception {
        var filter = new AuthRateLimitFilter(new ObjectMapper(), "");
        for (int attempt = 1; attempt <= 6; attempt++) {
            var request = new MockHttpServletRequest("POST", "/api/users");
            request.setRemoteAddr("192.0.2.9");
            var response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertEquals(attempt <= 5 ? 200 : 429, response.getStatus());
        }
    }
}
