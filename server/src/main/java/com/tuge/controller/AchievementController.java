package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.Result;
import com.tuge.domain.service.AchievementService;
import com.tuge.domain.vo.AchievementVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AchievementController {
    private final AchievementService service;
    public AchievementController(AchievementService service) { this.service = service; }
    @GetMapping("/achievements") public Result<java.util.List<AchievementVO>> list(@RequestParam(required = false) String state) { return Result.success(service.list(JwtContext.getUserId(), state)); }
    @GetMapping("/achievements/{code}") public Result<AchievementVO> detail(@PathVariable String code) { return Result.success(service.detail(JwtContext.getUserId(), code)); }
    @GetMapping("/me/achievements") public Result<java.util.List<AchievementVO>> mine(@RequestParam(required = false) String state) { requireUser(); return Result.success(service.list(JwtContext.getUserId(), state)); }
    @PostMapping("/me/achievements/check") public Result<java.util.List<AchievementVO>> check() { requireUser(); return Result.success(service.check(JwtContext.getUserId())); }
    private void requireUser() { if (JwtContext.getUserId() == null) throw new com.tuge.common.exception.BusinessException(401, "请先登录"); }
}
