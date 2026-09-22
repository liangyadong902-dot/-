package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DmMessageVO {
    private Long id;
    private Long senderId;
    private boolean mine;
    /** 消息类型：text / image */
    private String msgType;
    private String content;
    private LocalDateTime createdAt;
}
