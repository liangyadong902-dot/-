package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("diary_template")
public class DiaryTemplate {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String content;
    private Integer sortWeight;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
