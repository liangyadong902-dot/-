package com.tuge.common.util;

import com.tuge.common.jwt.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 解析可选的用户 JWT。公开内容接口携带合法 Token 时可返回个性化数据。
 */
public final class OptionalUser {

    private OptionalUser() {
    }

    public static Long id(HttpServletRequest request, JwtTokenUtil tokenUtil) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        String token = header.substring(7);
        if (!tokenUtil.validateToken(token) || !"user".equals(tokenUtil.parseRole(token))) {
            return null;
        }
        return tokenUtil.parseUserId(token);
    }
}
