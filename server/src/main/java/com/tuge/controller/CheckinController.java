package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.CheckinRequest;
import com.tuge.domain.service.CheckinService;
import com.tuge.domain.vo.CheckinVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/checkins")
public class CheckinController {
    private final CheckinService service;

    public CheckinController(CheckinService service) { this.service = service; }

    @GetMapping
    public Result<PageResult<CheckinVO>> list(@RequestParam(defaultValue = "1") long page,
                                               @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.list(JwtContext.getUserId(), page, pageSize));
    }

    @GetMapping("/{id}")
    public Result<CheckinVO> detail(@PathVariable Long id) {
        return Result.success(service.detail(JwtContext.getUserId(), id));
    }

    @PostMapping
    public Result<CheckinVO> create(@Valid @RequestBody CheckinRequest request) {
        return Result.success(service.create(JwtContext.getUserId(), request));
    }
}
