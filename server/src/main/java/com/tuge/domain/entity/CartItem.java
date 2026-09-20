package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("cart_item")
public class CartItem {
    @TableId(type = IdType.AUTO) private Long id;
    private Long userId;
    private Long boxId;
    private Integer quantity;
    private Integer selected;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
