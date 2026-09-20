package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDate;

/**
 * 管理端行程只读列表。
 */
@Data
public class AdminTripVO {
    private Long id;
    private Long userId;
    private String userName;
    private String orderNo;
    private Long routeId;
    private String routeName;
    private String location;
    private String boxName;
    private Integer priceCent;
    private Integer valueCent;
    private String validity;
    private LocalDate openedDate;
}
