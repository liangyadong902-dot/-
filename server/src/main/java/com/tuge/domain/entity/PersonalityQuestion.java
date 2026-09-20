package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("personality_question")
public class PersonalityQuestion {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Integer seq;
    private String stem;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
