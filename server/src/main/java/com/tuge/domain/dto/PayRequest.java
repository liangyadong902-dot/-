package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PayRequest(
        @NotBlank(message = "支付渠道不能为空")
        @Pattern(regexp = "alipay", message = "仅支持支付宝支付")
        String channel) {
}
