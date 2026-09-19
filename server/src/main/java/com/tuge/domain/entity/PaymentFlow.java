package com.tuge.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("payment_flow")
public class PaymentFlow {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String flowNo;
    private Long orderId;
    private String orderNo;
    private String channel;
    private String channelTradeNo;
    private Integer amountCent;
    private String result;
    private String notifyId;
    private String rawNotify;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
