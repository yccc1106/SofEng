package com.meetu.backend.post;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PostAccessTests {
    @Autowired MockMvc mvc;
    @MockitoBean PostRepository posts;

    @Test
    void guestCanListPublishedPostsWithPaginationButCannotWrite() throws Exception {
        when(posts.list(isNull(), isNull(), eq(2), eq(5))).thenReturn(List.of());
        when(posts.count(isNull(), isNull())).thenReturn(11L);
        mvc.perform(get("/api/posts?page=2&pageSize=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagination.page").value(2))
                .andExpect(jsonPath("$.pagination.totalPages").value(3));
        mvc.perform(post("/api/posts").contentType("application/json").content("{\"content\":\"test\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/posts/example/like")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/posts?page=0")).andExpect(status().isBadRequest());
    }

    @Test
    void commentsOnNonPublishedPostAreHidden() throws Exception {
        when(posts.find(eq("missing"), isNull())).thenReturn(Optional.empty());
        mvc.perform(get("/api/posts/missing/comments")).andExpect(status().isNotFound());
    }
}
