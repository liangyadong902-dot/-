package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_achievement")
public class UserAchievement {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long achievementId;
    private Integer progress;
    private Boolean unlocked;
    private LocalDateTime unlockedAt;
    private Boolean rewardSent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
