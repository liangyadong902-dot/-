package com.tuge.controller.admin;

import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.BadgeUpsertRequest;
import com.tuge.domain.dto.BannerUpsertRequest;
import com.tuge.domain.dto.BoxUpsertRequest;
import com.tuge.domain.dto.RouteUpsertRequest;
import com.tuge.domain.dto.StatusRequest;
import com.tuge.domain.service.ContentAdminService;
import com.tuge.domain.vo.AdminBadgeVO;
import com.tuge.domain.vo.AdminBannerVO;
import com.tuge.domain.vo.AdminBoxVO;
import com.tuge.domain.vo.AdminRouteVO;
import com.tuge.domain.vo.RoutePoolVO;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "管理端-配置")
@RestController
@RequestMapping("/api/v1/admin")
public class ContentAdminController {

    private final ContentAdminService contentAdminService;

    public ContentAdminController(ContentAdminService contentAdminService) {
        this.contentAdminService = contentAdminService;
    }

    @GetMapping("/boxes")
    public Result<PageResult<AdminBoxVO>> boxes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(contentAdminService.listBoxes(keyword, category, status, page, pageSize));
    }

    @PostMapping("/boxes")
    public Result<AdminBoxVO> createBox(@RequestBody BoxUpsertRequest request) {
        return Result.success(contentAdminService.createBox(request));
    }

    @PutMapping("/boxes/{id}")
    public Result<AdminBoxVO> updateBox(@PathVariable Long id, @RequestBody BoxUpsertRequest request) {
        return Result.success(contentAdminService.updateBox(id, request));
    }

    @DeleteMapping("/boxes/{id}")
    public Result<Void> deleteBox(@PathVariable Long id) {
        contentAdminService.deleteBox(id);
        return Result.success();
    }

    @PatchMapping("/boxes/{id}/status")
    public Result<Void> updateBoxStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        contentAdminService.updateBoxStatus(id, request == null ? null : request.status());
        return Result.success();
    }

    @GetMapping("/boxes/{id}/pool")
    public Result<RoutePoolVO> boxPool(@PathVariable Long id) {
        return Result.success(contentAdminService.boxPool(id));
    }

    @GetMapping("/routes")
    public Result<PageResult<AdminRouteVO>> routes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long badgeId,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(contentAdminService.listRoutes(keyword, category, status, badgeId, page, pageSize));
    }

    @PostMapping("/routes")
    public Result<AdminRouteVO> createRoute(@RequestBody RouteUpsertRequest request) {
        return Result.success(contentAdminService.createRoute(request));
    }

    @PutMapping("/routes/{id}")
    public Result<AdminRouteVO> updateRoute(@PathVariable Long id, @RequestBody RouteUpsertRequest request) {
        return Result.success(contentAdminService.updateRoute(id, request));
    }

    @DeleteMapping("/routes/{id}")
    public Result<Void> deleteRoute(@PathVariable Long id) {
        contentAdminService.deleteRoute(id);
        return Result.success();
    }

    @PatchMapping("/routes/{id}/status")
    public Result<Void> updateRouteStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        contentAdminService.updateRouteStatus(id, request == null ? null : request.status());
        return Result.success();
    }

    @GetMapping("/badges")
    public Result<PageResult<AdminBadgeVO>> badges(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(contentAdminService.listBadges(page, pageSize));
    }

    @PostMapping("/badges")
    public Result<AdminBadgeVO> createBadge(@RequestBody BadgeUpsertRequest request) {
        return Result.success(contentAdminService.createBadge(request));
    }

    @PutMapping("/badges/{id}")
    public Result<AdminBadgeVO> updateBadge(@PathVariable Long id, @RequestBody BadgeUpsertRequest request) {
        return Result.success(contentAdminService.updateBadge(id, request));
    }

    @GetMapping("/banners")
    public Result<PageResult<AdminBannerVO>> banners(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(contentAdminService.listBanners(page, pageSize));
    }

    @PostMapping("/banners")
    public Result<AdminBannerVO> createBanner(@RequestBody BannerUpsertRequest request) {
        return Result.success(contentAdminService.createBanner(request));
    }

    @PutMapping("/banners/{id}")
    public Result<AdminBannerVO> updateBanner(@PathVariable Long id, @RequestBody BannerUpsertRequest request) {
        return Result.success(contentAdminService.updateBanner(id, request));
    }

    @DeleteMapping("/banners/{id}")
    public Result<Void> deleteBanner(@PathVariable Long id) {
        contentAdminService.deleteBanner(id);
        return Result.success();
    }

    @PatchMapping("/banners/{id}/status")
    public Result<Void> updateBannerStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        contentAdminService.updateBannerStatus(id, request == null ? null : request.status());
        return Result.success();
    }
}
