package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TopicUpsertRequest(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 500) String coverUrl,
        @Size(max = 255) String description,
        Integer heatWeight,
        Integer sortWeight,
        String status,
        Integer version) {}
