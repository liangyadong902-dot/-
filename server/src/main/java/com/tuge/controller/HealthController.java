package com.tuge.controller;

import com.tuge.common.result.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 健康检查
 */
@RestController
public class HealthController {

    @GetMapping("/api/v1/health")
    public Result<Map<String, Object>> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", "UP");
        data.put("service", "tuge-server");
        return Result.success(data);
    }
}