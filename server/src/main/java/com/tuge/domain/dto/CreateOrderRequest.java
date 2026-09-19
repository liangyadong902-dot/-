package com.tuge.domain.dto;

import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(@NotNull(message = "盲盒不能为空") Long boxId) {
}
