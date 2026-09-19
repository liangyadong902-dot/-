package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 盲盒适配景点类型。
 */
@Data
@TableName("blind_box_scene")
public class BlindBoxScene {

    private Long boxId;
    private String scene;
}
