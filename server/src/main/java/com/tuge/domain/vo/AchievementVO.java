package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AchievementVO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private String requirementType;
    private Integer requirementValue;
    private Integer level;
    private Integer sortWeight;
    private Integer progress;
    private Boolean unlocked;
    private LocalDateTime unlockedAt;
}
