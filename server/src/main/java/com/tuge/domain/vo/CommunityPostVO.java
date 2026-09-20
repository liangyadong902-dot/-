package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommunityPostVO {
    private Long id;
    private Long userId;
    private String authorName;
    private String content;
    private List<String> images;
    private Long topicId;
    private String topicName;
    private String locationTag;
    private Long linkedBlindBoxId;
    private Long linkedCheckinId;
    private Long linkedTripId;
    private Integer likeCount;
    private Integer commentCount;
    private Integer shareCount;
    private Integer collectCount;
    private Boolean liked;
    private Boolean collected;
    private String status;
    private LocalDateTime createdAt;
}
