package com.tuge.domain.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class AiMemoryService {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final AiProperties properties;

    public AiMemoryService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper, AiProperties properties) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    public List<MemoryMessage> read(String key) {
        try {
            List<String> values = redisTemplate.opsForList().range(key, 0, -1);
            if (values == null) return List.of();
            List<MemoryMessage> result = new ArrayList<>();
            for (String value : values) result.add(objectMapper.readValue(value, MemoryMessage.class));
            return result;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    public void append(String key, MemoryMessage message, boolean guest) {
        try {
            redisTemplate.opsForList().rightPush(key, objectMapper.writeValueAsString(message));
            int window = Math.max(2, properties.getMemory().getWindow());
            redisTemplate.opsForList().trim(key, -window, -1);
            if (guest) redisTemplate.expire(key, Duration.ofHours(24));
        } catch (JsonProcessingException ignored) {
            // A failed cache write must never block chat or fallback responses.
        } catch (RuntimeException ignored) {
            // Redis is optional for a single request; database history remains available to logged-in users.
        }
    }

    public void warm(String key, List<MemoryMessage> messages) {
        if (!read(key).isEmpty() || messages.isEmpty()) return;
        messages.forEach(message -> append(key, message, false));
    }

    public record MemoryMessage(String role, String content) { }
}
