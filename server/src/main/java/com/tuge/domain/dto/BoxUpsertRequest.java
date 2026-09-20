package com.tuge.domain.dto;

import java.util.List;
import java.util.Map;

public record BoxUpsertRequest(
        String name,
        String category,
        String tag,
        String rankTag,
        String intro,
        String description,
        Double price,
        Double minValue,
        String coverUrl,
        List<String> imageUrls,
        List<String> includes,
        Map<String, Object> guidePreview,
        List<String> moods,
        Integer sortWeight,
        String status,
        Integer version) {
}
