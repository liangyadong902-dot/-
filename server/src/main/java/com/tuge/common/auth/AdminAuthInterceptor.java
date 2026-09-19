package com.tuge.common.auth;

import com.tuge.common.exception.BusinessException;
import com.tuge.common.exception.UnauthenticatedException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.entity.AdminUser;
import com.tuge.domain.mapper.AdminUserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * 管理端认证拦截器。校验 token，角色须为种子账号五种之一。
 */
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private static final Set<String> ADMIN_ROLES = Set.of(
            "super_admin", "operator", "cs", "finance", "analyst");

    private final JwtTokenUtil jwtTokenUtil;
    private final AdminUserMapper adminUserMapper;

    public AdminAuthInterceptor(JwtTokenUtil jwtTokenUtil, AdminUserMapper adminUserMapper) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.adminUserMapper = adminUserMapper;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) {
        String token = AuthInterceptor.resolveToken(request);
        if (token == null || !jwtTokenUtil.validateToken(token)) {
            throw new UnauthenticatedException();
        }
        Long userId = jwtTokenUtil.parseUserId(token);
        String role = jwtTokenUtil.parseRole(token);
        AdminUser user = adminUserMapper.selectById(userId);
        if (user == null || !"on".equals(user.getStatus()) || !ADMIN_ROLES.contains(role)
                || !role.equals(user.getRole())) {
            throw new BusinessException(403, "无管理端权限");
        }
        JwtContext.set(userId, role);
        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request,
                                @NonNull HttpServletResponse response,
                                @NonNull Object handler, Exception ex) {
        JwtContext.clear();
    }
}
