package com.tuge.domain.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class UserStatsVO {
    private int tripCount;
    private BigDecimal savedTotal;
    private int levelNo;
    private String title;
    private BigDecimal welfareKm;
    private int badgeUnlocked;
    private int badgeTotal;
    private String personalityType;
    private List<String> destinations;
    private int destinationCount;
    private BigDecimal spendTotal;
    private String recentMood;
    private String favoriteCategory;
    private int monthTrips;
    private int diaryCount;
}
