package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class CheckinVO {
    private Long checkinId;
    private SocialUserVO user;
    private Long tripId;
    private Long routeId;
    private String locationName;
    private boolean publicLocation;
    private List<String> imageUrls = new ArrayList<>();
    private String note;
    private String posterUrl;
    private int likeCount;
    private boolean liked;
    private String status;
    private LocalDateTime createdAt;
    private Integer version;
}
