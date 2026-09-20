package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("topic")
public class Topic {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String coverUrl;
    private String description;
    private Integer postCount;
    private Integer followCount;
    private Integer sortWeight;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
