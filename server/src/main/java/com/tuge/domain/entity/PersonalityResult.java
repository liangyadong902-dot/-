package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("personality_result")
public class PersonalityResult {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String type;
    private String name;
    private String mark;
    private String description;
    private String recommend;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
