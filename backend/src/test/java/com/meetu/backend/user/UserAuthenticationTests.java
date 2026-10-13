package com.meetu.backend.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserAuthenticationTests {
    @Autowired MockMvc mvc;
    @MockitoBean UserRepository users;

    @Test
    void guestCannotReadProfileAndCrossSiteWriteIsRejected() throws Exception {
        mvc.perform(get("/api/users/profile")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/users").header("Origin", "https://evil.example")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginRejectsRestrictedAccounts() throws Exception {
        var restricted = user("FROZEN", "USER");
        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(restricted));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"Password123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void sessionRechecksAccountStatusAndRole() throws Exception {
        var active = user("ACTIVE", "USER");
        when(users.findByEmail("test@example.com")).thenReturn(Optional.of(active));
        when(users.findById("user-id")).thenReturn(Optional.of(active));
        var login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"Password123\"}"))
                .andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) login.getRequest().getSession(false);
        mvc.perform(get("/api/users/profile").session(session)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
        mvc.perform(get("/api/admin/users").session(session)).andExpect(status().isForbidden());
        when(users.findById("user-id")).thenReturn(Optional.of(user("FROZEN", "USER")));
        mvc.perform(get("/api/users/profile").session(session)).andExpect(status().isUnauthorized());
    }

    private UserRepository.User user(String status, String role) {
        var encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        return new UserRepository.User("user-id", "Tester", "test@example.com", encoder.encode("Password123"),
                null, role, status, null, null, null, null, null, "SECRET", null, new String[0], "UNVERIFIED");
    }
}
