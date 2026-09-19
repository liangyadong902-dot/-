package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_order")
public class BizOrder {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String orderNo;
    private Long userId;
    private Long boxId;
    private String boxName;
    private String boxCategory;
    private Integer priceCent;
    private Integer paidCent;
    private Integer minValueCent;
    private String status;
    private String payChannel;
    private LocalDateTime expireAt;
    private LocalDateTime paidAt;
    private LocalDateTime openedAt;
    private LocalDateTime cancelledAt;
    private Long routeId;
    private Long tripId;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
