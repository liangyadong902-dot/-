package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TripVO {
    private Long id;
    private Long orderId;
    private Long boxId;
    private String boxName;
    private String boxCoverUrl;
    private String boxCategory;
    private Integer priceCent;
    private String routeName;
    private String location;
    private Integer valueCent;
    private String highlight;
    private List<String> includeList;
    private Integer guideVersion;
    private String moodText;
    private String badgeName;
    private String validity;
    private String diaryText;
    private LocalDateTime diaryAt;
    private LocalDate openedDate;
}
