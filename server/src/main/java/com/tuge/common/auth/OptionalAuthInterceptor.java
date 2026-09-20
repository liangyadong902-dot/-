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

/** Resolves a user when a token is present, while allowing anonymous requests. */
@Component
public class OptionalAuthInterceptor implements HandlerInterceptor {
    private final JwtTokenUtil jwtTokenUtil;
    private final AppUserMapper userMapper;

    public OptionalAuthInterceptor(JwtTokenUtil jwtTokenUtil, AppUserMapper userMapper) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.userMapper = userMapper;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) {
        String token = AuthInterceptor.resolveToken(request);
        if (token == null) return true;
        if (!jwtTokenUtil.validateToken(token) || !"user".equals(jwtTokenUtil.parseRole(token))) {
            throw new UnauthenticatedException();
        }
        Long userId = jwtTokenUtil.parseUserId(token);
        AppUser user = userMapper.selectById(userId);
        if (user == null) throw new UnauthenticatedException();
        if (!"normal".equals(user.getStatus())) throw new BusinessException(403, "账号已被禁用");
        JwtContext.set(userId, "user");
        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request,
                                @NonNull HttpServletResponse response,
                                @NonNull Object handler, Exception ex) {
        JwtContext.clear();
    }
}
