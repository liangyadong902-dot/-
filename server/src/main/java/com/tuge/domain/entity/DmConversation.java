package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 私信会话
 */
@Data
@TableName("dm_conversation")
public class DmConversation {
    @TableId(type = IdType.AUTO) private Long id;
    private Long userLowId;
    private Long userHighId;
    private String lastMessage;
    private Long lastSenderId;
    private LocalDateTime lastMessageAt;
    private Integer lowUnread;
    private Integer highUnread;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
