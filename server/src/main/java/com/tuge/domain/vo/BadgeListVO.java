package com.tuge.domain.vo;

import lombok.Data;

import java.util.List;

/**
 * 徽章列表（含进度条分母）
 */
@Data
public class BadgeListVO {

    private long total;
    private List<BadgeVO> list;
}
