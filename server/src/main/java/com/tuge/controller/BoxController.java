package com.tuge.controller;

import com.tuge.common.result.Result;
import com.tuge.domain.service.BlindBoxService;
import com.tuge.domain.vo.BlindBoxVO;
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

    public BoxController(BlindBoxService blindBoxService) {
        this.blindBoxService = blindBoxService;
    }

    @Operation(summary = "上架盲盒列表")
    @GetMapping("/boxes")
    public Result<List<BlindBoxVO>> listBoxes(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String mood) {
        return Result.success(blindBoxService.listBoxes(category, mood));
    }

    @Operation(summary = "盲盒详情")
    @GetMapping("/boxes/{id}")
    public Result<BlindBoxVO> getBox(@PathVariable Long id) {
        return Result.success(blindBoxService.getBox(id));
    }
}