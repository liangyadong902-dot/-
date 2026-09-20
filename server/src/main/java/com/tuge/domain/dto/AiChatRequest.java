package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiChatRequest(
        @NotBlank(message = "请输入想问的问题")
        @Size(max = 2000, message = "问题不能超过2000个字符") String text,
        Boolean viaQuick,
        @Size(max = 64, message = "会话标识不正确") String sessionId) { }
