package com.tuge.domain.service;

import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.AiChatRequest;
import com.tuge.domain.mapper.ChatMessageMapper;
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
    private AiMemoryService memoryService;
    private AiConfigService configService;
    private AiFallbackService fallbackService;
    private AiChatService service;

    @BeforeEach
    void setUp() {
        messageMapper = mock(ChatMessageMapper.class);
        memoryService = mock(AiMemoryService.class);
        configService = mock(AiConfigService.class);
        fallbackService = mock(AiFallbackService.class);
        when(memoryService.read(anyString())).thenReturn(List.of());
        service = new AiChatService(messageMapper, memoryService, configService,
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

        var result = service.chat(7L, new AiChatRequest("你好", true, "ignored_guest_session"));

        assertThat(result.getSessionId()).isNull();
        assertThat(result.isFallback()).isTrue();
        verify(messageMapper, org.mockito.Mockito.times(2)).insert(any());
        verify(memoryService).warm("chat:mem:user:7", List.of());
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
