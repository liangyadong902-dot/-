package com.tuge.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CommunityPostRequest(
        @NotBlank @Size(max = 500) String content,
        List<@Size(max = 500) String> images,
        Long topicId,
        @Size(max = 100) String locationTag,
        Long linkedBlindBoxId,
        Long linkedCheckinId,
        Long linkedTripId) {
}
