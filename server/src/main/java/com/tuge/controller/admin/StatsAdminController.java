package com.tuge.controller.admin;

import com.tuge.common.result.Result;
import com.tuge.domain.service.AdminStatsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/stats")
public class StatsAdminController {
    private final AdminStatsService service;

    public StatsAdminController(AdminStatsService service) { this.service = service; }

    @GetMapping("/users")
    public Result<Map<String, Object>> users(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate begin,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return Result.success(service.users(begin, end));
    }

    @GetMapping("/pay")
    public Result<Map<String, Object>> pay(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate begin,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return Result.success(service.pay(begin, end));
    }

    @GetMapping("/content")
    public Result<Map<String, Object>> content(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate begin,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return Result.success(service.content(begin, end));
    }
}
