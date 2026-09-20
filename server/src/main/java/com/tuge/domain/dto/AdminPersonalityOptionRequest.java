package com.tuge.domain.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record AdminPersonalityOptionRequest(
        @Min(1) Integer seq,
        @NotBlank @Size(max = 128) String label,
        @NotEmpty Map<String, @Min(0) Integer> score) { }
