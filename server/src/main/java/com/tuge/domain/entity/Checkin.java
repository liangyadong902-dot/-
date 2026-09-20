package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("checkin")
public class Checkin {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long tripId;
    private Long routeId;
    private String location;
    private Double latitude;
    private Double longitude;
    private String photoUrl;
    private String note;
    private String sharePosterUrl;
    private Integer likeCount;
    private LocalDateTime createdAt;
}
