package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommunityCommentVO {
    private Long commentId;
    private Long postId;
    private Long parentCommentId;
    private Long replyToUserId;
    private SocialUserVO author;
    private String content;
    private String status;
    private int replyCount;
    private LocalDateTime createdAt;
    private Integer version;
}
