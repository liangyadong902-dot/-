package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 站内消息通知
 */
@Data
@TableName("notification")
public class Notification {
    @TableId(type = IdType.AUTO) private Long id;
    private Long userId;
    private String type;
    private Long actorId;
    private Long postId;
    private Long commentId;
    private String content;
    private Integer isRead;
    private LocalDateTime createdAt;
}
