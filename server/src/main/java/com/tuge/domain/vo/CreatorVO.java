package com.tuge.domain.vo;

import lombok.Data;

@Data
public class CreatorVO {
    private int rank;
    private SocialUserVO user;
    private long postCount;
    private long checkinCount;
    private long influenceScore;
}
