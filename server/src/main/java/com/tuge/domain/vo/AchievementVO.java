package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AchievementVO {
    private Long achievementId;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private String requirementType;
    private Integer requirementValue;
    private Integer currentProgress;
    private int progressPercent;
    private Integer level;
    private String state;
    private LocalDateTime unlockedAt;
    private String status;
    private Integer version;
}
