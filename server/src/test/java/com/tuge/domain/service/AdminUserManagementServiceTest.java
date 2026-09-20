package com.tuge.domain.service;

import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.domain.dto.AdminUserStatusRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.TripMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminUserManagementServiceTest {
    private AppUserMapper userMapper;
    private AdminAuditService auditService;
    private AdminUserManagementService service;

    @BeforeEach
    void setUp() {
        userMapper = mock(AppUserMapper.class);
        auditService = mock(AdminAuditService.class);
        service = new AdminUserManagementService(userMapper, mock(TripMapper.class), mock(BizOrderMapper.class),
                mock(UserStatsService.class), mock(BadgeService.class), new AdminAccessService(), auditService);
    }

    @AfterEach
    void clearContext() { JwtContext.clear(); }

    @Test
    void analystCannotDisableUser() {
        JwtContext.set(1L, "analyst");

        assertThatThrownBy(() -> service.updateStatus(7L, new AdminUserStatusRequest("disabled", "测试")))
                .isInstanceOf(BusinessException.class).extracting("code").isEqualTo(403);
        verify(userMapper, never()).selectById(any());
    }

    @Test
    void customerServiceDisableWritesAudit() {
        JwtContext.set(2L, "cs");
        AppUser user = new AppUser(); user.setId(7L); user.setStatus("normal");
        when(userMapper.selectById(7L)).thenReturn(user);

        service.updateStatus(7L, new AdminUserStatusRequest("disabled", "风险账号"));

        verify(userMapper).updateById(user);
        verify(auditService).record(eq("user_disable"), eq("user"), eq(7L), any());
    }
}
