package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminContentStatusRequest(
        @NotBlank String toStatus,
        @Size(max = 255) String reason,
        Integer version) {}
