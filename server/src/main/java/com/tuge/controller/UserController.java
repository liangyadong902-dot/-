package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.Result;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.dto.UserUpdateRequest;
import com.tuge.domain.dto.PhoneLoginRequest;
import com.tuge.domain.vo.UserVO;
import com.tuge.domain.service.AuthService;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.tuge.domain.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户端 · 我的
 */
@Tag(name = "用户端-账号")
@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @Operation(summary = "当前登录用户信息")
    @GetMapping("/me")
    public Result<UserVO> me() {
        AppUser user = userService.currentUser(JwtContext.getUserId());
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setNickname(user.getNickname());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setPhone(user.getPhone());
        vo.setGender(user.getGender());
        vo.setCity(user.getCity());
        vo.setRegisterChannel(user.getRegisterChannel());
        vo.setStatus(user.getStatus());
        return Result.success(vo);
    }

    @PutMapping("/me")
    public Result<UserVO> update(@RequestBody UserUpdateRequest request) {
        return Result.success(userService.update(JwtContext.getUserId(), request));
    }

    @PostMapping("/me/bind-phone")
    public Result<Void> bindPhone(@RequestBody PhoneLoginRequest request) {
        authService.bindPhone(JwtContext.getUserId(), request.phone(), request.code());
        return Result.success();
    }
}
