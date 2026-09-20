package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("trip")
public class Trip {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long orderId;
    private Long routeId;
    private Long boxId;
    private String boxName;
    private String boxCategory;
    private Integer priceCent;
    private String routeName;
    private String location;
    private Integer valueCent;
    private String highlight;
    private String includeJson;
    private String guideSnapshotJson;
    private Integer guideVersion;
    private String moodText;
    private String badgeName;
    private String validity;
    private String diaryText;
    private LocalDateTime diaryAt;
    private LocalDate openedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
