package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationVO {
    private Long id;
    private String type;
    private Long actorId;
    private String actorNickname;
    private String actorAvatarUrl;
    private Long postId;
    private Long commentId;
    private String content;
    private boolean read;
    private LocalDateTime createdAt;
}
