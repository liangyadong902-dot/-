package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_topic_follow")
public class UserTopicFollow {
    @TableId(type = IdType.AUTO) private Long id;
    private Long userId;
    private Long topicId;
    private LocalDateTime createdAt;
}
