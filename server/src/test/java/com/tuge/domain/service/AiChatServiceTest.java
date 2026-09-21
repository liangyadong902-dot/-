package com.tuge.domain.service;

import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.AiChatRequest;
import com.tuge.domain.mapper.ChatMessageMapper;
import com.tuge.domain.mapper.AiConversationMapper;
import com.tuge.domain.entity.AiConversation;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiChatServiceTest {
    private ChatMessageMapper messageMapper;
    private AiConversationMapper conversationMapper;
    private AiMemoryService memoryService;
    private AiConfigService configService;
    private AiFallbackService fallbackService;
    private AiChatService service;

    @BeforeEach
    void setUp() {
        messageMapper = mock(ChatMessageMapper.class);
        conversationMapper = mock(AiConversationMapper.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), AiConversation.class);
        memoryService = mock(AiMemoryService.class);
        configService = mock(AiConfigService.class);
        fallbackService = mock(AiFallbackService.class);
        when(memoryService.read(anyString())).thenReturn(List.of());
        service = new AiChatService(messageMapper, conversationMapper, memoryService, configService,
                mock(AiToolService.class), fallbackService, mock(DeepSeekClient.class));
    }

    @Test
    void guestGetsStableSessionButDoesNotWriteDatabase() {
        when(configService.modelEnabled()).thenReturn(false);
        when(configService.fallbackEnabled()).thenReturn(true);
        when(fallbackService.reply("去哪玩")).thenReturn(new AiFallbackService.FallbackReply("去成都", List.of()));

        var result = service.chat(null, new AiChatRequest("去哪玩", false, "guest_123456"));

        assertThat(result.isFallback()).isTrue();
        assertThat(result.getSessionId()).isEqualTo("guest_123456");
        verify(messageMapper, never()).insert(any());
        verify(memoryService).append("chat:mem:guest:guest_123456",
                new AiMemoryService.MemoryMessage("user", "去哪玩"), true);
    }

    @Test
    void loggedInFallbackPersistsBothMessages() {
        when(configService.modelEnabled()).thenReturn(false);
        when(configService.fallbackEnabled()).thenReturn(true);
        when(fallbackService.reply(anyString())).thenReturn(new AiFallbackService.FallbackReply("降级回复", List.of()));
        when(messageMapper.selectList(any())).thenReturn(List.of());

        var result = service.chat(7L, new AiChatRequest("你好", true, null));

        assertThat(result.getSessionId()).isEqualTo("user:7");
        assertThat(result.isFallback()).isTrue();
        verify(messageMapper, org.mockito.Mockito.times(2)).insert(any());
        verify(memoryService).warm("chat:mem:user:7", List.of());
    }

    @Test
    void loggedInConversationUsesIndependentMemoryKey() {
        when(configService.modelEnabled()).thenReturn(false);
        when(configService.fallbackEnabled()).thenReturn(true);
        when(fallbackService.reply(anyString())).thenReturn(new AiFallbackService.FallbackReply("降级回复", List.of()));
        when(messageMapper.selectList(any())).thenReturn(List.of());
        AiConversation conversation = new AiConversation();
        conversation.setId("user:7:abcdefgh");
        conversation.setUserId(7L);
        when(conversationMapper.selectById("user:7:abcdefgh")).thenReturn(conversation);

        var result = service.chat(7L, new AiChatRequest("新会话", false, "user:7:abcdefgh"));

        assertThat(result.getSessionId()).isEqualTo("user:7:abcdefgh");
        verify(memoryService).warm("chat:mem:user:7:abcdefgh", List.of());
    }

    @Test
    void loggedInUserCannotUseAnotherUsersConversation() {
        assertThatThrownBy(() -> service.chat(7L, new AiChatRequest("你好", false, "user:8:abcdefgh")))
                .isInstanceOf(BusinessException.class).extracting("code").isEqualTo(403);
    }

    @Test
    void disabledFallbackSurfacesServiceUnavailable() {
        when(configService.modelEnabled()).thenReturn(false);
        when(configService.fallbackEnabled()).thenReturn(false);

        assertThatThrownBy(() -> service.chat(null, new AiChatRequest("你好", false, null)))
                .isInstanceOf(BusinessException.class).extracting("code").isEqualTo(503);
        verify(fallbackService, never()).reply(anyString());
    }
}
