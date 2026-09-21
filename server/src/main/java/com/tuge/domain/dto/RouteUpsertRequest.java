package com.tuge.domain.dto;

import java.util.List;
import java.util.Map;

public record RouteUpsertRequest(
        String name,
        String category,
        String destination,
        String scene,
        String imageUrl,
        Double value,
        Double cost,
        Long badgeId,
        String highlight,
        List<String> includes,
        Map<String, Object> guide,
        Integer guideVersion,
        String moodText,
        String status) {
}
