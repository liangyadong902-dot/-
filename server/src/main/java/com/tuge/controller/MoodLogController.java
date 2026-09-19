package com.tuge.controller;

import com.tuge.common.result.Result;
import com.tuge.common.util.OptionalUser;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.dto.MoodLogRequest;
import com.tuge.domain.service.MoodLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

@Tag(name = "用户端-内容")
@RestController
@RequestMapping("/api/v1/mood-logs")
public class MoodLogController {

    private final MoodLogService moodLogService;
    private final JwtTokenUtil jwtTokenUtil;

    public MoodLogController(MoodLogService moodLogService, JwtTokenUtil jwtTokenUtil) {
        this.moodLogService = moodLogService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @PostMapping
    public Result<Void> create(@RequestBody MoodLogRequest request, HttpServletRequest httpRequest) {
        moodLogService.create(request, OptionalUser.id(httpRequest, jwtTokenUtil));
        return Result.success();
    }
}
