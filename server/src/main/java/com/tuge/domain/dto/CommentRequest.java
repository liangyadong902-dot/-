package com.tuge.domain.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotNull Long postId,
        @Size(max = 500) String content,
        Long parentId) {
}
