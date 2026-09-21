package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
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
        int currentVersion = user.getVersion() == null ? 0 : user.getVersion();
        if (request != null && request.version() != null && request.version() != currentVersion) {
            throw new BusinessException(409, "用户资料已在其他设备更新");
        }
        if (request != null) {
            if (request.nickname() != null && !request.nickname().isBlank()) user.setNickname(request.nickname().trim());
            if (request.avatarUrl() != null && (request.avatarUrl().startsWith("https://") || request.avatarUrl().startsWith("http://"))) user.setAvatarUrl(request.avatarUrl().trim());
            if (request.gender() != null) user.setGender(request.gender());
            if (request.city() != null) user.setCity(request.city().trim());
        }
        int nextVersion = currentVersion + 1;
        int updated = appUserMapper.update(null, new UpdateWrapper<AppUser>()
                .eq("id", userId)
                .eq("version", currentVersion)
                .set("nickname", user.getNickname())
                .set("avatar_url", user.getAvatarUrl())
                .set("gender", user.getGender())
                .set("city", user.getCity())
                .set("version", nextVersion));
        if (updated == 0) throw new BusinessException(409, "用户资料已在其他设备更新");
        user.setVersion(nextVersion);
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
        vo.setVersion(user.getVersion());
        return vo;
    }
}
