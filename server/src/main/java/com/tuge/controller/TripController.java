package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.service.TripService;
import com.tuge.domain.service.AiDiaryService;
import com.tuge.domain.vo.DiaryResultVO;
import com.tuge.domain.vo.TripVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trips")
public class TripController {
    private final TripService tripService;
    private final AiDiaryService aiDiaryService;

    public TripController(TripService tripService, AiDiaryService aiDiaryService) {
        this.tripService = tripService;
        this.aiDiaryService = aiDiaryService;
    }

    @GetMapping
    public Result<PageResult<TripVO>> list(@RequestParam(defaultValue = "1") long page,
                                           @RequestParam(defaultValue = "20") long pageSize,
                                           @RequestParam(defaultValue = "valid") String validity) {
        return Result.success(tripService.list(JwtContext.getUserId(), validity, page, pageSize));
    }

    @GetMapping("/{id}")
    public Result<TripVO> detail(@PathVariable Long id) {
        return Result.success(tripService.detail(JwtContext.getUserId(), id));
    }

    @PostMapping("/{id}/diary")
    public Result<DiaryResultVO> diary(@PathVariable Long id) {
        return Result.success(aiDiaryService.generate(JwtContext.getUserId(), id));
    }
}
