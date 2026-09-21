package com.tuge.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiConversationVO {
    private String id;
    private String title;
    private String preview;
    private LocalDateTime updatedAt;
    private int messageCount;
}
