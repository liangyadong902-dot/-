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
    /** 关联帖子的首图（通知列表右侧缩略图） */
    private String postCoverUrl;
    private boolean read;
    private LocalDateTime createdAt;
}
