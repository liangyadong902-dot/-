package com.tuge.domain.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PersonalitySubmitRequest(
        @NotEmpty(message = "请完成全部题目") List<@Min(0) Integer> answers,
        @Min(value = 0, message = "作答耗时不能为负数")
        @Max(value = 3600000, message = "作答耗时超出范围") Integer durationMs) { }
