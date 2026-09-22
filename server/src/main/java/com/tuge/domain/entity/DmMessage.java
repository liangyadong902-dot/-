package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 私信消息
 */
@Data
@TableName("dm_message")
public class DmMessage {
    @TableId(type = IdType.AUTO) private Long id;
    private Long conversationId;
    private Long senderId;
    /** 消息类型：text / image */
    private String msgType;
    private String content;
    private Integer isRead;
    private LocalDateTime createdAt;
}
