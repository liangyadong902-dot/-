package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class CommunityPostVO {
    private Long postId;
    private String title;
    private String content;
    private List<String> imageUrls = new ArrayList<>();
    private SocialUserVO author;
    private TopicVO topic;
    private String locationName;
    private boolean publicLocation;
    private LinkedContentVO linkedBox;
    private LinkedContentVO linkedTrip;
    private LinkedContentVO linkedCheckin;
    private int likeCount;
    private int collectCount;
    private int commentCount;
    private int shareCount;
    private boolean liked;
    private boolean collected;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer version;
}
