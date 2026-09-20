package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("community_post")
public class CommunityPost {
    @TableId(type = IdType.AUTO) private Long id;
    private Long userId;
    private String title;
    private String content;
    private Long topicId;
    private String locationName;
    private Integer publicLocation;
    private Double latitude;
    private Double longitude;
    private Long linkedBlindBoxId;
    private Long linkedCheckinId;
    private Long linkedTripId;
    private Integer likeCount;
    private Integer commentCount;
    private Integer shareCount;
    private Integer collectCount;
    private String status;
    private LocalDateTime featuredAt;
    private Long reviewedBy;
    private String reviewReason;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
