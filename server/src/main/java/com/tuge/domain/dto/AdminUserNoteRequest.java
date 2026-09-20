package com.tuge.domain.dto;

import jakarta.validation.constraints.Size;

public record AdminUserNoteRequest(@Size(max = 500, message = "客服备注不能超过500个字符") String note) { }
