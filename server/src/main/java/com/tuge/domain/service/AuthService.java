package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtTokenUtil;
import com.tuge.domain.dto.PhoneLoginRequest;
import com.tuge.domain.dto.UserUpdateRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.vo.LoginVO;
import com.tuge.domain.vo.UserVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final String DEMO_CODE = "123456";
    private static final Pattern PHONE = Pattern.compile("^1\\d{10}$");
    private static final Map<String, Long> SMS_SENT_AT = new ConcurrentHashMap<>();

    private final AppUserMapper appUserMapper;
    private final JwtTokenUtil jwtTokenUtil;
    private final WechatCode2SessionClient wechatClient;

    public AuthService(AppUserMapper appUserMapper, JwtTokenUtil jwtTokenUtil,
                       WechatCode2SessionClient wechatClient) {
        this.appUserMapper = appUserMapper;
        this.jwtTokenUtil = jwtTokenUtil;
        this.wechatClient = wechatClient;
    }

    public void sendSms(String phone) {
        validatePhone(phone);
        SMS_SENT_AT.put(phone, System.currentTimeMillis());
    }

    @Transactional
    public LoginVO loginByPhone(PhoneLoginRequest request) {
        validatePhone(request.phone());
        if (!DEMO_CODE.equals(request.code())) {
            throw new BusinessException(401, "验证码错误或已过期");
        }
        Long sentAt = SMS_SENT_AT.get(request.phone());
        if (sentAt == null || System.currentTimeMillis() - sentAt > 5 * 60 * 1000L) {
            throw new BusinessException(401, "请先获取验证码");
        }
        AppUser user = appUserMapper.selectOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getPhone, request.phone()));
        if (user == null) {
            user = new AppUser();
            user.setPhone(request.phone());
            user.setNickname("途友" + request.phone().substring(7));
            user.setRegisterChannel("phone");
            user.setStatus("normal");
            appUserMapper.insert(user);
        }
        return login(user);
    }

    @Transactional
    public LoginVO loginByWechat(com.tuge.domain.dto.WechatLoginRequest request) {
        if (request == null || request.code() == null || request.code().isBlank()) {
            throw new BusinessException(400, "微信登录凭证不能为空");
        }
        WechatCode2SessionClient.Session session = wechatClient.exchange(request.code());
        String openid = session.openid();
        AppUser user = appUserMapper.selectOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getWechatOpenid, openid));
        if (user == null) {
            user = new AppUser();
            user.setWechatOpenid(openid);
            user.setWechatUnionid(session.unionid());
            user.setNickname("微信途友");
            user.setRegisterChannel("wechat");
            user.setStatus("normal");
            appUserMapper.insert(user);
        }
        if (session.unionid() != null && !session.unionid().isBlank()) user.setWechatUnionid(session.unionid());
        if (request.nickname() != null && !request.nickname().isBlank()) user.setNickname(request.nickname().trim());
        if (usableAvatar(request.avatarUrl())) user.setAvatarUrl(request.avatarUrl().trim());
        if (request.gender() != null) user.setGender(request.gender());
        if (request.city() != null) user.setCity(request.city().trim());
        return login(user);
    }

    @Transactional
    public UserVO update(Long userId, UserUpdateRequest request) {
        AppUser user = current(userId);
        if (request != null) {
            if (request.nickname() != null && !request.nickname().isBlank()) {
                user.setNickname(request.nickname().trim());
            }
            if (usableAvatar(request.avatarUrl())) user.setAvatarUrl(request.avatarUrl().trim());
            if (request.gender() != null) user.setGender(request.gender());
            if (request.city() != null) user.setCity(request.city().trim());
        }
        user.setLastActiveAt(LocalDateTime.now());
        appUserMapper.updateById(user);
        return toVO(user);
    }

    @Transactional
    public void bindPhone(Long userId, String phone, String code) {
        validatePhone(phone);
        if (!DEMO_CODE.equals(code) || !SMS_SENT_AT.containsKey(phone)) {
            throw new BusinessException(401, "验证码错误或已过期");
        }
        AppUser duplicate = appUserMapper.selectOne(new LambdaQueryWrapper<AppUser>()
                .eq(AppUser::getPhone, phone));
        if (duplicate != null && !duplicate.getId().equals(userId)) {
            throw new BusinessException(409, "手机号已绑定其他账号");
        }
        AppUser user = current(userId);
        user.setPhone(phone);
        appUserMapper.updateById(user);
    }

    public AppUser current(Long userId) {
        AppUser user = appUserMapper.selectById(userId);
        if (user == null) throw new BusinessException(404, "用户不存在");
        if (!"normal".equals(user.getStatus())) throw new BusinessException(403, "账号已被禁用");
        return user;
    }

    public UserVO toVO(AppUser user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setNickname(user.getNickname());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setPhone(user.getPhone());
        vo.setGender(user.getGender());
        vo.setCity(user.getCity());
        vo.setRegisterChannel(user.getRegisterChannel());
        vo.setStatus(user.getStatus());
        return vo;
    }

    private LoginVO login(AppUser user) {
        if (!"normal".equals(user.getStatus())) throw new BusinessException(403, "账号已被禁用");
        LocalDateTime now = LocalDateTime.now();
        user.setLastLoginAt(now);
        user.setLastActiveAt(now);
        appUserMapper.updateById(user);
        LoginVO vo = new LoginVO();
        vo.setToken(jwtTokenUtil.generateToken(user.getId(), "user"));
        vo.setUser(toVO(user));
        return vo;
    }

    private boolean usableAvatar(String url) {
        return url != null && url.startsWith("https://") && url.length() <= 512;
    }

    private void validatePhone(String phone) {
        if (phone == null || !PHONE.matcher(phone).matches()) {
            throw new BusinessException(400, "手机号格式不正确");
        }
    }
}
