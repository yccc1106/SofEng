package com.meetu.backend.admin;

import com.meetu.backend.user.entity.UserEntity;
import com.meetu.backend.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ManagementAccessTests {
    @Autowired MockMvc mvc;
    @MockitoBean UserService users;

    @Test
    void allManagementReadEndpointsRejectGuestsAndOrdinaryUsers() throws Exception {
        when(users.findActiveSessionUser("ordinary")).thenReturn(Optional.of(new UserEntity(
                "ordinary","Ordinary","ordinary@example.test",null,null,"USER","ACTIVE",null,null,null,
                null,null,null,null,new String[0],"UNVERIFIED")));
        for (String path : new String[] {"/api/admin/users", "/api/admin/verification", "/api/admin/interest",
                "/api/admin/feedback", "/api/admin/stats", "/api/admin/moderation/posts", "/api/admin/moderation/chats",
                "/api/admin/moderation/rooms"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).with(user("ordinary"))).andExpect(status().isForbidden());
        }
        mvc.perform(post("/api/feedback").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
