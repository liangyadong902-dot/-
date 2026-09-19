package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 盲盒
 */
@Data
@TableName("blind_box")
public class BlindBox {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;
    private String category;
    private String tag;
    private String rankTag;
    private String intro;
    private Integer priceCent;
    private Integer minValueCent;
    private String coverUrl;
    private Integer sortWeight;
    private String status;
    private Integer openCount;

    @JsonIgnore
    private LocalDateTime createdAt;

    @JsonIgnore
    private LocalDateTime updatedAt;
}