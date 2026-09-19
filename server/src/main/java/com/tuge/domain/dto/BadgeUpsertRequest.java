package com.tuge.domain.dto;

public record BadgeUpsertRequest(
        String name,
        String mark,
        String description,
        Integer sortWeight) {
}
