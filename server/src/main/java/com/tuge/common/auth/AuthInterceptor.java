package com.tuge.common.auth;

import com.tuge.common.exception.UnauthenticatedException;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.mapper.AppUserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 用户端认证拦截器（{@code /api/v1/**} 中需要登录的接口）
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtTokenUtil jwtTokenUtil;
    private final AppUserMapper appUserMapper;

    public AuthInterceptor(JwtTokenUtil jwtTokenUtil, AppUserMapper appUserMapper) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.appUserMapper = appUserMapper;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) {
        String token = resolveToken(request);
        if (token == null || !jwtTokenUtil.validateToken(token)) {
            throw new UnauthenticatedException();
        }
        Long userId = jwtTokenUtil.parseUserId(token);
        String role = jwtTokenUtil.parseRole(token);
        AppUser user = appUserMapper.selectById(userId);
        if (user == null || !"user".equals(role)) {
            throw new UnauthenticatedException();
        }
        if (!"normal".equals(user.getStatus())) throw new BusinessException(403, "账号已被禁用");
        JwtContext.set(userId, role);
        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request,
                                @NonNull HttpServletResponse response,
                                @NonNull Object handler, Exception ex) {
        JwtContext.clear();
    }

    static String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
