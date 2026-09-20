package com.tuge.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckinRequest(
        @NotNull Long tripId,
        @Size(max = 200) String location,
        Double latitude,
        Double longitude,
        List<@Size(max = 500) String> photoUrls,
        @Size(max = 500) String note,
        @Size(max = 500) String sharePosterUrl) {
}
