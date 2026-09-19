package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RefundRequest(
        @NotBlank(message = "退款原因不能为空")
        @Size(max = 255, message = "退款原因不能超过255个字符")
        String reason,
        @NotBlank(message = "退款类型不能为空")
        @Pattern(regexp = "value_guard|unused", message = "退款类型不正确")
        String kind) {
}
