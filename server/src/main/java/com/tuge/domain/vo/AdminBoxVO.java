package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminBoxVO extends BlindBoxVO {

    private Integer sortWeight;
    private Integer openCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String warning;
}
