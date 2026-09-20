package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.dto.WechatLoginRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.vo.LoginVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceWechatTest {

    private AppUserMapper userMapper;
    private JwtTokenUtil jwtTokenUtil;
    private WechatCode2SessionClient wechatClient;
    private AuthService service;

    @BeforeEach
    void setUp() {
        userMapper = mock(AppUserMapper.class);
        jwtTokenUtil = mock(JwtTokenUtil.class);
        wechatClient = mock(WechatCode2SessionClient.class);
        service = new AuthService(userMapper, jwtTokenUtil, wechatClient);
    }

    @Test
    @SuppressWarnings("unchecked")
    void createsWechatUserAndPersistsAuthorizedProfile() {
        when(wechatClient.exchange("valid-code"))
                .thenReturn(new WechatCode2SessionClient.Session("openid-a", "unionid-a"));
        when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        doAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            user.setId(101L);
            return 1;
        }).when(userMapper).insert(any(AppUser.class));
        when(jwtTokenUtil.generateToken(101L, "user")).thenReturn("token-a");

        LoginVO result = service.loginByWechat(new WechatLoginRequest(
                "valid-code", "微信途友", "https://cdn.example.com/avatar.jpg", 2, "杭州"));

        assertThat(result.getToken()).isEqualTo("token-a");
        assertThat(result.getUser().getNickname()).isEqualTo("微信途友");
        assertThat(result.getUser().getAvatarUrl()).isEqualTo("https://cdn.example.com/avatar.jpg");
        assertThat(result.getUser().getCity()).isEqualTo("杭州");
        verify(userMapper).insert(any(AppUser.class));
        verify(userMapper).updateById(any(AppUser.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void reusesExistingUserForSameOpenid() {
        AppUser existing = normalUser(202L);
        existing.setWechatOpenid("openid-a");
        when(wechatClient.exchange("next-code"))
                .thenReturn(new WechatCode2SessionClient.Session("openid-a", null));
        when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);
        when(jwtTokenUtil.generateToken(202L, "user")).thenReturn("token-existing");

        LoginVO result = service.loginByWechat(new WechatLoginRequest(
                "next-code", "更新昵称", null, null, null));

        assertThat(result.getUser().getId()).isEqualTo(202L);
        assertThat(result.getUser().getNickname()).isEqualTo("更新昵称");
        verify(userMapper, never()).insert(any(AppUser.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void rejectsDisabledWechatUser() {
        AppUser disabled = normalUser(303L);
        disabled.setStatus("disabled");
        when(wechatClient.exchange("valid-code"))
                .thenReturn(new WechatCode2SessionClient.Session("openid-disabled", null));
        when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(disabled);

        assertThatThrownBy(() -> service.loginByWechat(
                new WechatLoginRequest("valid-code", null, null, null, null)))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(403);
    }

    @Test
    void propagatesInvalidWechatCode() {
        when(wechatClient.exchange("invalid-code"))
                .thenThrow(new BusinessException(401, "微信登录凭证无效"));

        assertThatThrownBy(() -> service.loginByWechat(
                new WechatLoginRequest("invalid-code", null, null, null, null)))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(401);
    }

    private AppUser normalUser(long id) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setNickname("微信途友");
        user.setRegisterChannel("wechat");
        user.setStatus("normal");
        return user;
    }
}
