package com.meetu.backend.chat;

import com.meetu.backend.chat.dto.ChatDtos;
import com.meetu.backend.chat.mapper.ChatMapper;
import com.meetu.backend.chat.service.impl.ChatServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatRulesTests {
    private final ChatMapper mapper=mock(ChatMapper.class);
    private final ChatServiceImpl chat=new ChatServiceImpl(mapper,mock(ApplicationEventPublisher.class));
    private void active() { when(mapper.activeUser("viewer")).thenReturn("viewer"); }

    @Test void onlyFriendsCanReadAndSendDirectMessages() {
        active(); when(mapper.activeUser("other")).thenReturn("other");
        var target=new ChatDtos.Target("other",null,null);
        assertThrows(ChatServiceImpl.ChatForbidden.class,() -> chat.history("viewer",target,null));
        assertThrows(ChatServiceImpl.ChatForbidden.class,() -> chat.send("viewer",new ChatDtos.Send("hello","other",null,null,null)));
        verify(mapper,never()).insert(anyString(),anyString(),anyString(),any(),any(),any());
    }

    @Test void pendingTeamMemberCannotReadOrSend() {
        active(); when(mapper.activeTeam("team")).thenReturn("team");
        assertThrows(ChatServiceImpl.ChatForbidden.class,
                () -> chat.history("viewer",new ChatDtos.Target(null,"team",null),null));
    }

    @Test void targetMustBeExclusiveAndMessageMustHaveContent() {
        active();
        assertThrows(ChatServiceImpl.InvalidChatRequest.class,
                () -> chat.history("viewer",new ChatDtos.Target("other","team",null),null));
        when(mapper.categoryExists("category")).thenReturn("category");
        assertThrows(ChatServiceImpl.InvalidChatRequest.class,
                () -> chat.send("viewer",new ChatDtos.Send("  ",null,null,"category",null)));
    }

    @Test void historyCursorMustBelongToConversation() {
        active(); when(mapper.categoryExists("category")).thenReturn("category");
        when(mapper.cursor("old")).thenReturn(Map.of("id","old","categoryId","another",
                "createdAt",Timestamp.from(Instant.now())));
        assertThrows(ChatServiceImpl.InvalidChatRequest.class,
                () -> chat.history("viewer",new ChatDtos.Target(null,null,"category"),"old"));
        verify(mapper,never()).category(anyString(),any(),any());
    }
}
