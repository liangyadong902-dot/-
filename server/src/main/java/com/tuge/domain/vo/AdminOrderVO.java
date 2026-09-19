package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminOrderVO {
    private String orderNo;
    private Long userId;
    private String userName;
    private String phone;
    private String boxName;
    private Integer priceCent;
    private Integer paidCent;
    private String status;
    private String payChannel;
    private String routeName;
    private Long tripId;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime openedAt;
}
