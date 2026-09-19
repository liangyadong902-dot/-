package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminBannerVO {

    private Long id;
    private String title;
    private String subTitle;
    private String tag;
    private String imageUrl;
    private String jumpType;
    private String jumpTarget;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer sortWeight;
    private String status;
}
