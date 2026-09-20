package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CheckinVO {
    private Long id;
    private Long userId;
    private Long tripId;
    private Long routeId;
    private String location;
    private Double latitude;
    private Double longitude;
    private List<String> photoUrls;
    private String note;
    private String sharePosterUrl;
    private Integer likeCount;
    private LocalDateTime createdAt;
}
