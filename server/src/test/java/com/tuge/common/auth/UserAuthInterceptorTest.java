package com.tuge.common.auth;

import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.mapper.AppUserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserAuthInterceptorTest {

    @Test
    void requiredAuthReturnsForbiddenForDisabledUserWithValidToken() {
        JwtTokenUtil tokens = validUserToken();
        AppUserMapper users = mock(AppUserMapper.class);
        when(users.selectById(7L)).thenReturn(disabledUser());
        AuthInterceptor interceptor = new AuthInterceptor(tokens, users);

        assertThatThrownBy(() -> interceptor.preHandle(request(), new MockHttpServletResponse(), new Object()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(403);
    }

    @Test
    void optionalAuthReturnsForbiddenForDisabledUserWithValidToken() {
        JwtTokenUtil tokens = validUserToken();
        AppUserMapper users = mock(AppUserMapper.class);
        when(users.selectById(7L)).thenReturn(disabledUser());
        OptionalAuthInterceptor interceptor = new OptionalAuthInterceptor(tokens, users);

        assertThatThrownBy(() -> interceptor.preHandle(request(), new MockHttpServletResponse(), new Object()))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(403);
    }

    private JwtTokenUtil validUserToken() {
        JwtTokenUtil tokens = mock(JwtTokenUtil.class);
        when(tokens.validateToken("valid-token")).thenReturn(true);
        when(tokens.parseUserId("valid-token")).thenReturn(7L);
        when(tokens.parseRole("valid-token")).thenReturn("user");
        return tokens;
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        return request;
    }

    private AppUser disabledUser() {
        AppUser user = new AppUser();
        user.setId(7L);
        user.setStatus("disabled");
        return user;
    }
}
