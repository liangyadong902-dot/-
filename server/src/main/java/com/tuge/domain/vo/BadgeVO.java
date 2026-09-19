package com.tuge.domain.vo;

import lombok.Data;

/**
 * 徽章（用户端图鉴）
 */
@Data
public class BadgeVO {

    private Long id;
    private String name;
    private String mark;
    private String description;
    private Boolean unlocked;
    private String unlockedAt;
}
