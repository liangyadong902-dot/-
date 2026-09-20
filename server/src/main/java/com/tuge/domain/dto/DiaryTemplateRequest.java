package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DiaryTemplateRequest(
        @NotBlank @Size(max = 4000) String content,
        Integer sortWeight,
        @Pattern(regexp = "on|off") String status) { }
