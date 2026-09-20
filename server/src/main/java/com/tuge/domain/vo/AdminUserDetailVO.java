package com.tuge.domain.vo;

import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
public class AdminUserDetailVO extends AdminUserVO {
    private String city;
    private Integer gender;
    private String recentMood;
    private UserStatsVO stats;
    private List<BadgeVO> badges = Collections.emptyList();
    private List<AdminOrderVO> recentOrders = Collections.emptyList();
    private List<AdminTripVO> recentTrips = Collections.emptyList();
    private String csNote;
    private String disableReason;
}
