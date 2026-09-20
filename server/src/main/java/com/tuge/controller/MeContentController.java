package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.service.CheckinService;
import com.tuge.domain.service.CommunityService;
import com.tuge.domain.vo.CheckinVO;
import com.tuge.domain.vo.CommunityPostVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class MeContentController {
    private final CommunityService communityService;
    private final CheckinService checkinService;

    public MeContentController(CommunityService communityService, CheckinService checkinService) {
        this.communityService = communityService;
        this.checkinService = checkinService;
    }

    @GetMapping("/posts")
    public Result<PageResult<CommunityPostVO>> posts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(communityService.myPosts(JwtContext.getUserId(), status, page, pageSize));
    }

    @GetMapping("/collections")
    public Result<PageResult<CommunityPostVO>> collections(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(communityService.collections(JwtContext.getUserId(), page, pageSize));
    }

    @GetMapping("/checkins")
    public Result<PageResult<CheckinVO>> checkins(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(checkinService.list(JwtContext.getUserId(), page, pageSize));
    }
}
