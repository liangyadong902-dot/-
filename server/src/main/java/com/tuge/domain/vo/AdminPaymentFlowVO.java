package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminPaymentFlowVO {
    private String flowNo;
    private String orderNo;
    private String channel;
    private String channelTradeNo;
    private Integer amountCent;
    private String result;
    private LocalDateTime createdAt;
}
