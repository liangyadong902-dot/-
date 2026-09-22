package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DmSendRequest(
        @NotNull Long toUserId,
        @NotBlank @Size(max = 500) String content,
        String msgType) {}
