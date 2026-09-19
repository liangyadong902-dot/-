package com.tuge.domain.dto;

public record UserUpdateRequest(String nickname, String avatarUrl, Integer gender, String city) {
}
