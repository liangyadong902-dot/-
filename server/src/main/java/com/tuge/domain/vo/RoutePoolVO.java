package com.tuge.domain.vo;

import lombok.Data;

import java.util.List;

@Data
public class RoutePoolVO {

    private boolean ok;
    private List<AdminRouteVO> routes;
}
