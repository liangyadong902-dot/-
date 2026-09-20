package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("personality_option")
public class PersonalityOption {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long questionId;
    private Integer seq;
    private String label;
    private String scoreJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
