package com.tuge.domain.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PostCreateRequest(
        @NotBlank @Size(max = 30) String title,
        @NotBlank @Size(max = 500) String content,
        @Size(max = 9) List<@NotBlank @Size(max = 500) String> imageUrls,
        Long topicId,
        @Size(max = 100) String locationName,
        Boolean publicLocation,
        Double latitude,
        Double longitude,
        @JsonAlias("linkedBlindBoxId") Long linkedBoxId,
        Long linkedTripId,
        Long linkedCheckinId) {}
