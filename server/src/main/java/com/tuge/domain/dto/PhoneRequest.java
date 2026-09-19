package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;

public record PhoneRequest(@NotBlank(message = "手机号不能为空") String phone) {
}
