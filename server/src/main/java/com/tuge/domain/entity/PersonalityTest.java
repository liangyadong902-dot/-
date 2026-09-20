package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("personality_test")
public class PersonalityTest {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String resultType;
    private String scoreJson;
    private String answersJson;
    private Integer durationMs;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
