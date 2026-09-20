package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PayVO {
    private String channel;
    private String payUrl;
    private String payForm;
    private String qrCodeUrl;
    private String qrCodeBase64;
    private Boolean mock;
    private String status;
    private LocalDateTime expireAt;
}
