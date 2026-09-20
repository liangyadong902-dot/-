package com.tuge.domain.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminPersonalityQuestionRequest(
        @Min(1) Integer seq,
        @NotBlank @Size(max = 255) String stem,
        @Pattern(regexp = "on|off") String status) { }
