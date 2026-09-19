package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 盲盒适配心情
 */
@Data
@TableName("blind_box_mood")
public class BlindBoxMood {

    private Long boxId;
    private String mood;
}
