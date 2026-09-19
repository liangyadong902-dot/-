package com.tuge.domain.vo;

import lombok.Data;

import java.util.List;

@Data
public class AdminRouteVO {

    private Long id;
    private String name;
    private String category;
    private String destination;
    private String scene;
    private Double value;
    private Double cost;
    private Long badgeId;
    private String badgeName;
    private String badgeMark;
    private String highlight;
    private List<String> includes;
    private String moodText;
    private String status;
    private Integer drawCount;
    private boolean meetsGuarantee;
}
