package com.tuge.domain.vo;

import lombok.Data;

@Data
public class PayVO {
    private String payUrl;
    private String qrCodeUrl;
    private String qrCodeBase64;
    private Boolean mock;
    private String status;
}
