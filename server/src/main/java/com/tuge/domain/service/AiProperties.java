package com.tuge.domain.service;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {
    private boolean enabled;
    private String provider = "deepseek";
    private String baseUrl = "https://api.deepseek.com";
    private String model = "deepseek-chat";
    private String apiKey = "";
    private int timeoutMs = 12000;
    private boolean toolsEnabled = true;
    private boolean ragEnabled;
    private boolean fallbackEnabled = true;
    private Memory memory = new Memory();

    @Data
    public static class Memory {
        private int window = 16;
    }

    public boolean modelAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }
}
