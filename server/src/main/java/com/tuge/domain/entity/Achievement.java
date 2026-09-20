package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("achievement")
public class Achievement {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private String requirementType;
    private Integer requirementValue;
    private String rewardType;
    private String rewardValue;
    private Integer level;
    private Integer sortWeight;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
