package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.service.ProfileService;
import com.tuge.domain.vo.CommunityPostVO;
import com.tuge.domain.vo.UserProfileVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service) { this.service = service; }

    @GetMapping("/{id}/profile")
    public Result<UserProfileVO> profile(@PathVariable Long id) {
        return Result.success(service.profile(JwtContext.getUserId(), id));
    }

    @GetMapping("/{id}/posts")
    public Result<PageResult<CommunityPostVO>> posts(@PathVariable Long id,
                                                     @RequestParam(defaultValue = "1") long page,
                                                     @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.posts(JwtContext.getUserId(), id, page, pageSize));
    }
}
