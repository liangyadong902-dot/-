package com.tuge.domain.vo;

import lombok.Data;

import java.util.List;

/**
 * 盲盒视图对象（接口层金额为「元」）
 *
 * @see <a href="docs/openapi.yaml">BlindBox schema</a>
 */
@Data
public class BlindBoxVO {

    private Long id;
    private String name;
    private String category;
    private String tag;
    private String rankTag;
    private String intro;
    /** 售价（元） */
    private Double price;
    /** 保底票面价值（元） */
    private Double minValue;
    private String coverUrl;
    private List<String> moods;
    private List<String> scenes;
    private String status;
}
