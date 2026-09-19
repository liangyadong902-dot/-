package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户徽章解锁记录。
 */
@Data
@TableName("user_badge")
public class UserBadge {

    private Long userId;
    private Long badgeId;
    private Long sourceTripId;
    private LocalDateTime unlockedAt;
}
