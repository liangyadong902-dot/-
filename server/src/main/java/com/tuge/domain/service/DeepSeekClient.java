package com.tuge.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DeepSeekClient {
    private final AiProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public DeepSeekClient(AiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                .build();
    }

    public ModelReply chat(List<Map<String, String>> messages) {
        if (!properties.modelAvailable()) throw new IllegalStateException("AI model is disabled");
        RuntimeException last = null;
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                return execute(messages);
            } catch (Exception e) {
                last = new IllegalStateException("AI provider request failed", e);
            }
        }
        throw last == null ? new IllegalStateException("AI provider request failed") : last;
    }

    private ModelReply execute(List<Map<String, String>> messages) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.getModel());
        body.put("messages", messages);
        body.put("stream", false);
        body.put("temperature", 0.7);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint()))
                .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                .header("Authorization", "Bearer " + properties.getApiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("AI provider returned HTTP " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText("").trim();
        if (content.isBlank()) throw new IllegalStateException("AI provider returned empty content");
        int tokenIn = root.path("usage").path("prompt_tokens").asInt(0);
        int tokenOut = root.path("usage").path("completion_tokens").asInt(0);
        return new ModelReply(content, tokenIn, tokenOut);
    }

    private String endpoint() {
        String base = properties.getBaseUrl() == null ? "" : properties.getBaseUrl().replaceAll("/+$", "");
        return base + "/chat/completions";
    }

    public record ModelReply(String content, int tokenIn, int tokenOut) { }
}
