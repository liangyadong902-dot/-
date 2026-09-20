package com.tuge.domain.vo;

import lombok.Data;

@Data
public class SocialUserVO {
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private String city;
    private boolean followed;
    private long followerCount;
}
