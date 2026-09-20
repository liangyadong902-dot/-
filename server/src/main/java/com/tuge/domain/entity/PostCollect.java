package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("post_collect")
public class PostCollect {
    private Long postId;
    private Long userId;
    private LocalDateTime createdAt;
}
