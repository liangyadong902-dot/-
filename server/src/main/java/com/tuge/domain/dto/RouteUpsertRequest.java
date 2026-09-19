package com.tuge.domain.dto;

import java.util.List;

public record RouteUpsertRequest(
        String name,
        String category,
        String destination,
        String scene,
        Double value,
        Double cost,
        Long badgeId,
        String highlight,
        List<String> includes,
        String moodText,
        String status) {
}
