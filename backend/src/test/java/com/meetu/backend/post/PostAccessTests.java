package com.meetu.backend.post;

import com.meetu.backend.post.service.PostService;
import com.meetu.backend.post.service.impl.PostServiceImpl.PostNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

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
    @MockitoBean PostService posts;

    @Test
    void guestCanListPublishedPostsWithPaginationButCannotWrite() throws Exception {
        when(posts.list(isNull(), isNull(), eq(2), eq(5))).thenReturn(new PostService.Page(List.of(), 2, 5, 11L));
        mvc.perform(get("/api/posts?page=2&pageSize=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagination.page").value(2))
                .andExpect(jsonPath("$.pagination.totalPages").value(3));
        mvc.perform(post("/api/posts").header("Origin", "http://localhost:3000")
                        .contentType("application/json").content("{\"content\":\"test\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/posts/example/like").header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void commentsOnNonPublishedPostAreHidden() throws Exception {
        when(posts.comments("missing")).thenThrow(new PostNotFoundException());
        mvc.perform(get("/api/posts/missing/comments")).andExpect(status().isNotFound());
    }
}
