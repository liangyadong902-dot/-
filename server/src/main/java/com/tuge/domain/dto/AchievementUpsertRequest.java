package com.tuge.domain.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AchievementUpsertRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 50) String name,
        @Size(max = 200) String description,
        @Size(max = 500) String iconUrl,
        @NotBlank String requirementType,
        @Min(1) Integer requirementValue,
        Integer level,
        Integer sortWeight,
        String status,
        Integer version) {}
