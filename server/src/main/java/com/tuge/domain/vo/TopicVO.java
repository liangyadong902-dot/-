package com.tuge.domain.vo;

import lombok.Data;

@Data
public class TopicVO {
    private Long topicId;
    private String name;
    private String coverUrl;
    private String description;
    private Integer postCount;
    private Integer followCount;
    private boolean followed;
    private String status;
    private Integer version;
}
