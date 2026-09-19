package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 线路池线路。
 */
@Data
@TableName("travel_route")
public class TravelRoute {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;
    private String category;
    private String location;
    private String scene;
    private Integer valueCent;
    private Integer costCent;
    private Long badgeId;
    private String highlight;
    private String includeJson;
    private String moodText;
    private String status;
    private Integer drawCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
