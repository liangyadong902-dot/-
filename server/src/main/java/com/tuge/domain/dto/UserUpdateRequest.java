package com.tuge.domain.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Size(max = 30, message = "昵称不能超过30个字符") String nickname,
        @Pattern(regexp = "^https://.{1,500}$", message = "头像必须是可访问的 HTTPS 地址") String avatarUrl,
        @Min(value = 0, message = "性别取值不正确") @Max(value = 2, message = "性别取值不正确") Integer gender,
        @Size(max = 30, message = "城市不能超过30个字符") String city) {
}
