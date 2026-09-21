package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatMessageVO {
    private Long id;
    private String conversationId;
    private String role;
    private String content;
    private boolean fallback;
    private LocalDateTime createdAt;
}
