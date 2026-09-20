package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AiDefaultReplyRequest(
        @NotBlank @Size(max = 500) String text,
        Integer sortWeight,
        @Pattern(regexp = "on|off") String status) { }
