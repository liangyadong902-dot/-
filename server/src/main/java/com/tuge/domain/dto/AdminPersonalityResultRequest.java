package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminPersonalityResultRequest(
        @NotBlank @Pattern(regexp = "nature|city|adventure|culture") String type,
        @NotBlank @Size(max = 32) String name,
        @NotBlank @Size(max = 4) String mark,
        @NotBlank @Size(max = 255) String description,
        @NotBlank @Size(max = 255) String recommend) { }
