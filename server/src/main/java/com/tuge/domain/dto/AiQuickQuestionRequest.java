package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AiQuickQuestionRequest(
        @NotBlank @Size(max = 128) String text,
        Integer sortWeight,
        @Pattern(regexp = "on|off") String status) { }
