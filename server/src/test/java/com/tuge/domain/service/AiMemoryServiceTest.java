package com.tuge.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiMemoryServiceTest {
    @Test
    void trimsToConfiguredWindowAndExpiresGuestMemory() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked") ListOperations<String, String> lists = mock(ListOperations.class);
        when(redis.opsForList()).thenReturn(lists);
        AiProperties properties = new AiProperties();
        properties.getMemory().setWindow(16);
        AiMemoryService service = new AiMemoryService(redis, new ObjectMapper(), properties);

        service.append("chat:mem:guest:abc", new AiMemoryService.MemoryMessage("user", "hello"), true);

        verify(lists).trim("chat:mem:guest:abc", -16, -1);
        verify(redis).expire("chat:mem:guest:abc", Duration.ofHours(24));
    }
}
