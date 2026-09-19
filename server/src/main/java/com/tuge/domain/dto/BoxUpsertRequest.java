package com.tuge.domain.dto;

import java.util.List;

public record BoxUpsertRequest(
        String name,
        String category,
        String tag,
        String rankTag,
        String intro,
        Double price,
        Double minValue,
        String coverUrl,
        List<String> moods,
        Integer sortWeight,
        String status) {
}
