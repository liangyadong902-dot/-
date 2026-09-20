package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("community_post")
public class CommunityPost {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String content;
    private String images;
    private String topic;
    private Long topicId;
    private String locationTag;
    private Long linkedBlindBoxId;
    private Long linkedCheckinId;
    private Long linkedTripId;
    private Integer likeCount;
    private Integer commentCount;
    private Integer shareCount;
    private Integer collectCount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
