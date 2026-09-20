package com.tuge.controller;

import com.tuge.common.result.Result;
import com.tuge.common.result.PageResult;
import com.tuge.domain.service.BlindBoxService;
import com.tuge.domain.service.CommunityService;
import com.tuge.domain.vo.BlindBoxVO;
import com.tuge.domain.vo.CommunityPostVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 用户端 · 盲盒
 */
@Tag(name = "用户端-内容", description = "盲盒、Banner、徽章等公开内容")
@RestController
@RequestMapping("/api/v1")
public class BoxController {

    private final BlindBoxService blindBoxService;
    private final CommunityService communityService;

    public BoxController(BlindBoxService blindBoxService, CommunityService communityService) {
        this.blindBoxService = blindBoxService;
        this.communityService = communityService;
    }

    @Operation(summary = "上架盲盒列表")
    @GetMapping("/boxes")
    public Result<?> listBoxes(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) String sort) {
        if (page != null || pageSize != null || sort != null || (keyword != null && !keyword.isBlank())) {
            return Result.success(blindBoxService.listBoxesPage(category, mood, keyword, sort,
                    page == null ? 1 : page, pageSize == null ? 20 : pageSize));
        }
        return Result.success(blindBoxService.listBoxes(category, mood));
    }

    @Operation(summary = "盲盒详情")
    @GetMapping("/boxes/{id}")
    public Result<BlindBoxVO> getBox(@PathVariable Long id) {
        return Result.success(blindBoxService.getBox(id));
    }

    @Operation(summary = "盲盒关联社区帖子")
    @GetMapping("/boxes/{id}/related-posts")
    public Result<PageResult<CommunityPostVO>> relatedPosts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize) {
        blindBoxService.getBox(id);
        return Result.success(communityService.relatedPosts(id, page, pageSize));
    }
}
