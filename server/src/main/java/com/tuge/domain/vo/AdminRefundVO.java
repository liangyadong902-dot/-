package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminRefundVO {
    private String refundNo;
    private String orderNo;
    private Long userId;
    private String userName;
    private Integer amountCent;
    private String reason;
    private String kind;
    private String status;
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
