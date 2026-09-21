package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DmMessageVO {
    private Long id;
    private Long senderId;
    private boolean mine;
    private String content;
    private LocalDateTime createdAt;
}
