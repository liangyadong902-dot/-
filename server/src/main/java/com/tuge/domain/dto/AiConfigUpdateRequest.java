package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiConfigUpdateRequest(
        @NotBlank @Size(max = 500) String greet,
        @NotBlank @Size(max = 4000) String systemPrompt,
        @NotBlank @Size(max = 2000) String diaryPrompt,
        Boolean enabled,
        Boolean toolsEnabled,
        Boolean fallbackEnabled) { }
