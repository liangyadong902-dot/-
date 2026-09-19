package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 徽章定义
 */
@Data
@TableName("badge")
public class Badge {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String mark;
    private String icon;
    private String description;
    private Integer sortWeight;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
