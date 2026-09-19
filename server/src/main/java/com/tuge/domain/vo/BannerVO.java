package com.tuge.domain.vo;

import lombok.Data;

/**
 * 用户端运营位（字段名对齐 OpenAPI Banner）
 */
@Data
public class BannerVO {

    private Long id;
    private String title;
    private String subTitle;
    private String tag;
    private String imageUrl;
    private String jumpType;
    private String jumpTarget;
}
