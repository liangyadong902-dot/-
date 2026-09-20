package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ai_keyword_rule")
public class AiKeywordRule {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String keywordsJson;
    private String replyText;
    private String recommendBoxIds;
    private Integer sortWeight;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
