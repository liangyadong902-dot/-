package com.tuge.domain.service;

import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AdminAccessService {
    public static final Set<String> ALL = Set.of("super_admin", "operator", "cs", "finance", "analyst");
    public static final Set<String> USER_WRITE = Set.of("super_admin", "cs");
    public static final Set<String> EXPORT = Set.of("super_admin", "finance", "analyst");
    public static final Set<String> CONFIG_READ = Set.of("super_admin", "operator", "cs", "analyst");
    public static final Set<String> CONFIG_WRITE = Set.of("super_admin", "operator");

    public void require(Set<String> roles, String message) {
        if (!roles.contains(JwtContext.getRole())) throw new BusinessException(403, message);
    }
}
