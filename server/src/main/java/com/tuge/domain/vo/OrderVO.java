package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderVO {
    private String orderNo;
    private Long boxId;
    private String boxName;
    private String boxCategory;
    private Integer priceCent;
    private Integer paidCent;
    private String status;
    private String payChannel;
    private LocalDateTime expireAt;
    private LocalDateTime paidAt;
    private LocalDateTime openedAt;
    private Long tripId;
    private String refundNo;
    private Long routeId;
    private String routeName;
    private String location;
    private Integer routeValueCent;
    private String moodText;
}
