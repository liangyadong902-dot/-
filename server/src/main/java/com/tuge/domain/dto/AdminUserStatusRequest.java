package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminUserStatusRequest(
        @NotBlank @Pattern(regexp = "active|disabled", message = "用户状态不正确") String status,
        @Size(max = 255, message = "禁用原因不能超过255个字符") String reason) { }
