package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserProfileVO {
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private String city;
    private Integer gender;
    private LocalDateTime joinedAt;
    private long postCount;
    private long followerCount;
    private long followingCount;
    private long likeReceivedCount;
    private boolean followed;
    private boolean self;
}
