package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SmsSendRequest(
        @NotBlank(message = "手机号不能为空") String phone,
        @Pattern(regexp = "login|bind", message = "短信场景仅支持 login 或 bind") String scene) {
}
