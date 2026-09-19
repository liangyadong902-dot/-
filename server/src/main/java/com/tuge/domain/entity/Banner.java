package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 首页运营位
 */
@Data
@TableName("banner")
public class Banner {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String subtitle;
    private String tagText;
    private String imageUrl;
    private String jumpType;
    private String jumpValue;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer sortWeight;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
