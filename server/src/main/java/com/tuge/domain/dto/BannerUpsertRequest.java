package com.tuge.domain.dto;

import java.time.LocalDateTime;

public record BannerUpsertRequest(
        String title,
        String subTitle,
        String tag,
        String imageUrl,
        String jumpType,
        String jumpTarget,
        LocalDateTime startAt,
        LocalDateTime endAt,
        Integer sortWeight,
        String status) {
}
