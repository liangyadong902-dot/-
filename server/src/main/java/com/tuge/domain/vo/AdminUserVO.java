package com.tuge.domain.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminUserVO {
    private Long id;
    private String nickname;
    private String avatarUrl;
    private String phone;
    private String wechatNickname;
    private String channel;
    private int tripCount;
    private String title;
    private BigDecimal spendTotal;
    private BigDecimal savedTotal;
    private String status;
    private String personalityType;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
