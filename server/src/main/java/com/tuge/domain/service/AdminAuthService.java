package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.entity.AdminUser;
import com.tuge.domain.mapper.AdminUserMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 管理端鉴权
 */
@Service
public class AdminAuthService {

    private final AdminUserMapper adminUserMapper;
    private final JwtTokenUtil jwtTokenUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminAuthService(AdminUserMapper adminUserMapper, JwtTokenUtil jwtTokenUtil) {
        this.adminUserMapper = adminUserMapper;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    /**
     * 管理员登录，返回 token + 管理员信息
     */
    public Map<String, Object> login(String account, String password) {
        if (account == null || account.isBlank() || password == null || password.isBlank()) {
            throw new BusinessException(401, "账号或密码错误");
        }
        AdminUser user = adminUserMapper.selectOne(
                new LambdaQueryWrapper<AdminUser>().eq(AdminUser::getUsername, account));
        if (user == null || !"on".equals(user.getStatus())) {
            throw new BusinessException(401, "账号或密码错误");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(401, "账号或密码错误");
        }
        // 更新最后登录时间（可选；账号可能无 UPDATE 权限，失败不阻塞登录）
        try {
            user.setLastLoginAt(LocalDateTime.now());
            adminUserMapper.updateById(user);
        } catch (Exception ignored) {
            // 忽略：last_login_at 仅为审计字段
        }

        String token = jwtTokenUtil.generateToken(user.getId(), user.getRole());
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("admin", toProfile(user));
        return data;
    }

    /**
     * 当前管理员信息
     */
    public Map<String, Object> profile(Long adminId) {
        AdminUser user = adminUserMapper.selectById(adminId);
        if (user == null || !"on".equals(user.getStatus())) {
            throw new BusinessException(404, "管理员不存在");
        }
        return toProfile(user);
    }

    private Map<String, Object> toProfile(AdminUser user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("account", user.getUsername());
        m.put("name", user.getDisplayName());
        m.put("role", user.getRole());
        return m;
    }
}
