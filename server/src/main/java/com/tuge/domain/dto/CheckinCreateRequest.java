package com.tuge.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckinCreateRequest(
        @NotNull Long tripId,
        @NotBlank @Size(max = 100) String locationName,
        Boolean publicLocation,
        Double latitude,
        Double longitude,
        @Size(min = 1, max = 9) List<@NotBlank @Size(max = 500) String> imageUrls,
        @Size(max = 500) String note) {}
