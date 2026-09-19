package com.tuge.controller;

import com.tuge.common.result.Result;
import com.tuge.common.util.OptionalUser;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.service.BadgeService;
import com.tuge.domain.service.BannerService;
import com.tuge.domain.vo.BadgeListVO;
import com.tuge.domain.vo.BannerVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * 用户端 · Banner / 徽章
 */
@Tag(name = "用户端-内容", description = "盲盒、Banner、徽章等公开内容")
@RestController
@RequestMapping("/api/v1")
public class ContentController {

    private final BannerService bannerService;
    private final BadgeService badgeService;
    private final JwtTokenUtil jwtTokenUtil;

    public ContentController(BannerService bannerService, BadgeService badgeService, JwtTokenUtil jwtTokenUtil) {
        this.bannerService = bannerService;
        this.badgeService = badgeService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @Operation(summary = "当前有效 Banner")
    @GetMapping("/banners")
    public Result<List<BannerVO>> banners() {
        return Result.success(bannerService.listActive());
    }

    @Operation(summary = "全部徽章定义")
    @GetMapping("/badges")
    public Result<BadgeListVO> badges(HttpServletRequest request) {
        return Result.success(badgeService.listAll(OptionalUser.id(request, jwtTokenUtil)));
    }
}
