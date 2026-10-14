package com.meetu.backend.user;

import com.meetu.backend.user.entity.UserEntity;
import com.meetu.backend.user.dto.UserDtos.Login;
import com.meetu.backend.user.service.UserService;
import com.meetu.backend.user.service.impl.UserServiceImpl.RestrictedAccountException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserAuthenticationTests {
    @Autowired MockMvc mvc;
    @MockitoBean UserService users;

    @Test
    void guestCannotReadProfileAndCrossSiteWriteIsRejected() throws Exception {
        mvc.perform(get("/api/users/profile")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/radar")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/personality-test").header("Origin", "http://localhost:3000")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"answers\":{}}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/users").header("Origin", "https://evil.example")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginRejectsRestrictedAccounts() throws Exception {
        when(users.login(any(Login.class))).thenThrow(new RestrictedAccountException());
        mvc.perform(post("/api/auth/login").header("Origin", "http://localhost:3000")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"Password123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void sessionRechecksAccountStatusAndRole() throws Exception {
        var active = user("ACTIVE", "USER");
        when(users.login(any(Login.class))).thenReturn(active);
        when(users.findActiveSessionUser("user-id")).thenReturn(Optional.of(active));
        when(users.profile("user-id")).thenReturn(active);
        var login = mvc.perform(post("/api/auth/login").header("Origin", "http://localhost:3000")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"Password123\"}"))
                .andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) login.getRequest().getSession(false);
        mvc.perform(get("/api/users/profile").session(session)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
        mvc.perform(get("/api/admin/users").session(session)).andExpect(status().isForbidden());
        when(users.findActiveSessionUser("user-id")).thenReturn(Optional.empty());
        mvc.perform(get("/api/users/profile").session(session)).andExpect(status().isUnauthorized());
    }

    private UserEntity user(String status, String role) {
        var encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        return new UserEntity("user-id", "Tester", "test@example.com", encoder.encode("Password123"),
                null, role, status, null, null, null, null, null, "SECRET", null, new String[0], "UNVERIFIED");
    }
}
