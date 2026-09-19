package com.tuge.controller.admin;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.Result;
import com.tuge.domain.service.AdminAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 管理端 · 鉴权
 */
@Tag(name = "管理端-鉴权")
@RestController
@RequestMapping("/api/v1/admin")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    public AdminAuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @Operation(summary = "管理员登录")
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginDTO body) {
        return Result.success(adminAuthService.login(body.account(), body.password()));
    }

    @Operation(summary = "当前管理员信息")
    @GetMapping("/me")
    public Result<Map<String, Object>> me() {
        return Result.success(adminAuthService.profile(JwtContext.getUserId()));
    }

    public record LoginDTO(String account, String password) {
    }
}