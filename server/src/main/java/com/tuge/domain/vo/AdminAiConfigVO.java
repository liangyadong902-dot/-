package com.tuge.domain.vo;

import lombok.Data;

@Data
public class AdminAiConfigVO {
    private String greet;
    private String systemPrompt;
    private String diaryPrompt;
    private boolean enabled;
    private boolean toolsEnabled;
    private boolean fallbackEnabled;
}
