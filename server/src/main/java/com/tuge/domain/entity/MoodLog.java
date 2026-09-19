package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 首页心情选择日志。
 */
@Data
@TableName("mood_log")
public class MoodLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String mood;
    private Long boxId;
    private LocalDateTime createdAt;
}
