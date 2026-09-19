package com.tuge.domain.vo;

import lombok.Data;

@Data
public class AdminBadgeVO {

    private Long id;
    private String name;
    private String mark;
    private String icon;
    private String description;
    private Integer sortWeight;
    private long unlockedCount;
    private long routeCount;
}
