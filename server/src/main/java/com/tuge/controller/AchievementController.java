package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.Result;
import com.tuge.domain.service.AchievementService;
import com.tuge.domain.vo.AchievementVO;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/achievements")
public class AchievementController {
    private final AchievementService service;
    public AchievementController(AchievementService service) { this.service = service; }

    @GetMapping
    public Result<List<AchievementVO>> list() { return Result.success(service.list(JwtContext.getUserId())); }

    @PostMapping("/check")
    public Result<List<AchievementVO>> check() { return Result.success(service.check(JwtContext.getUserId())); }
}
