package com.tuge.domain.service;

import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.UserUpdateRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.vo.UserVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private AppUserMapper userMapper;
    private UserService service;

    @BeforeEach
    void setUp() {
        userMapper = mock(AppUserMapper.class);
        service = new UserService(userMapper);
    }

    @Test
    void updatesProfileAndKeepsHttpsAvatar() {
        AppUser user = user("normal");
        when(userMapper.selectById(1L)).thenReturn(user);

        UserVO result = service.update(1L, new UserUpdateRequest(
                "新昵称", "https://cdn.example.com/avatar.jpg", 1, "成都"));

        assertThat(result.getNickname()).isEqualTo("新昵称");
        assertThat(result.getAvatarUrl()).isEqualTo("https://cdn.example.com/avatar.jpg");
        assertThat(result.getGender()).isEqualTo(1);
        assertThat(result.getCity()).isEqualTo("成都");
        verify(userMapper).updateById(user);
    }

    @Test
    void rejectsDisabledUser() {
        when(userMapper.selectById(1L)).thenReturn(user("disabled"));

        assertThatThrownBy(() -> service.currentUser(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(403);
    }

    @Test
    void reportsMissingUserWithoutLeakingAnotherAccount() {
        when(userMapper.selectById(99L)).thenReturn(null);

        assertThatThrownBy(() -> service.currentUser(99L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(404);
    }

    private AppUser user(String status) {
        AppUser user = new AppUser();
        user.setId(1L);
        user.setNickname("原昵称");
        user.setRegisterChannel("wechat");
        user.setStatus(status);
        return user;
    }
}
