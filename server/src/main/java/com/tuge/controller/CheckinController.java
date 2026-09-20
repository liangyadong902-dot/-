package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.CheckinCreateRequest;
import com.tuge.domain.service.CheckinService;
import com.tuge.domain.vo.CheckinVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checkins")
public class CheckinController {
    private final CheckinService service;
    public CheckinController(CheckinService service) { this.service = service; }
    @PostMapping public Result<CheckinService.CheckinResult> create(@Valid @RequestBody CheckinCreateRequest request) { return Result.success(service.create(JwtContext.getUserId(), request)); }
    @GetMapping public Result<PageResult<CheckinVO>> list(@RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.list(JwtContext.getUserId(), page, pageSize)); }
    @GetMapping("/{id}") public Result<CheckinVO> detail(@PathVariable Long id) { return Result.success(service.detail(JwtContext.getUserId(), id)); }
    @PutMapping("/{id}/like") public Result<CheckinVO> like(@PathVariable Long id) { return Result.success(service.setLike(JwtContext.getUserId(), id, true)); }
    @DeleteMapping("/{id}/like") public Result<CheckinVO> unlike(@PathVariable Long id) { return Result.success(service.setLike(JwtContext.getUserId(), id, false)); }
    @PostMapping("/{id}/poster") public Result<CheckinVO> poster(@PathVariable Long id) { return Result.success(service.poster(JwtContext.getUserId(), id)); }
    @GetMapping("/rankings") public Result<java.util.List<CheckinVO>> rankings(@RequestParam(defaultValue = "all") String period) { return Result.success(service.ranking(period)); }
}
