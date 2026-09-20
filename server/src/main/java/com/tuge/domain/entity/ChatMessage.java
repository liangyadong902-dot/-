package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("chat_message")
public class ChatMessage {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String conversationId;
    private String sender;
    private String content;
    private Boolean viaQuick;
    private Integer tokenIn;
    private Integer tokenOut;
    private Boolean fallback;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
