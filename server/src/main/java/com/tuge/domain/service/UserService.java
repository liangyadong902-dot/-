package com.tuge.domain.service;

import com.tuge.common.exception.BusinessException;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.dto.UserUpdateRequest;
import com.tuge.domain.vo.UserVO;
import org.springframework.stereotype.Service;

/**
 * 用户业务
 */
@Service
public class UserService {

    private final AppUserMapper appUserMapper;

    public UserService(AppUserMapper appUserMapper) {
        this.appUserMapper = appUserMapper;
    }

    /**
     * 当前用户信息（要求已登录）
     */
    public AppUser currentUser(Long userId) {
        AppUser user = appUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        if (!"normal".equals(user.getStatus())) {
            throw new BusinessException(403, "账号已被禁用");
        }
        return user;
    }

    public UserVO update(Long userId, UserUpdateRequest request) {
        AppUser user = currentUser(userId);
        if (request != null) {
            if (request.nickname() != null && !request.nickname().isBlank()) user.setNickname(request.nickname().trim());
            if (request.avatarUrl() != null && request.avatarUrl().startsWith("https://")) user.setAvatarUrl(request.avatarUrl().trim());
            if (request.gender() != null) user.setGender(request.gender());
            if (request.city() != null) user.setCity(request.city().trim());
        }
        appUserMapper.updateById(user);
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setNickname(user.getNickname());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setPhone(user.getPhone());
        vo.setGender(user.getGender());
        vo.setCity(user.getCity());
        vo.setRegisterChannel(user.getRegisterChannel());
        vo.setStatus("normal".equals(user.getStatus()) ? "active" : "disabled");
        vo.setHasPhone(user.getPhone() != null && !user.getPhone().isBlank());
        vo.setWechatOpenidBound(user.getWechatOpenid() != null && !user.getWechatOpenid().isBlank());
        vo.setPersonalityType(user.getPersonalityType());
        return vo;
    }
}
