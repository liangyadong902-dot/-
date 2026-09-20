package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
public class AdminAiKeywordRuleVO {
    private Long id;
    private List<String> keywords = Collections.emptyList();
    private String replyText;
    private List<Long> recommendBoxIds = Collections.emptyList();
    private Integer sortWeight;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
