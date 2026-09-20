package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AiKeywordRuleRequest(
        @NotEmpty List<@NotBlank @Size(max = 64) String> keywords,
        @NotBlank @Size(max = 500) String replyText,
        List<Long> recommendBoxIds,
        Integer sortWeight,
        @Pattern(regexp = "on|off") String status) { }
