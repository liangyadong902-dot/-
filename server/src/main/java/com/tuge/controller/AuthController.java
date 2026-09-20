package com.tuge.controller;

import com.tuge.common.result.Result;
import com.tuge.domain.dto.PhoneLoginRequest;
import com.tuge.domain.dto.SmsSendRequest;
import com.tuge.domain.dto.WechatLoginRequest;
import com.tuge.domain.service.AuthService;
import com.tuge.domain.vo.LoginVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/sms/send")
    public Result<AuthService.SmsTicket> sendSms(@Valid @RequestBody SmsSendRequest request) {
        return Result.success(authService.sendSms(request.phone(), request.scene()));
    }

    @PostMapping("/login/phone")
    public Result<LoginVO> loginPhone(@Valid @RequestBody PhoneLoginRequest request) {
        return Result.success(authService.loginByPhone(request));
    }

    @PostMapping("/login/wechat")
    public Result<LoginVO> loginWechat(@Valid @RequestBody WechatLoginRequest request) {
        return Result.success(authService.loginByWechat(request));
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }
}
