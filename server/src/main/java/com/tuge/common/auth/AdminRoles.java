package com.tuge.common.auth;

import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;

/**
 * 管理端角色能力校验。
 */
public final class AdminRoles {

    private AdminRoles() {
    }

    public static void requireContentWrite() {
        String role = JwtContext.getRole();
        if (!"super_admin".equals(role) && !"operator".equals(role)) {
            throw new BusinessException(403, "当前角色无内容编辑权限");
        }
    }
}
