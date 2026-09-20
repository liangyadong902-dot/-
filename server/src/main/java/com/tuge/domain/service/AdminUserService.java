package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.AdminUserVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 管理端用户列表（只读）。鉴权由 {@code AdminAuthInterceptor} 统一完成。
 */
@Service
public class AdminUserService {

    private final AppUserMapper userMapper;
    private final TripMapper tripMapper;
    private final BizOrderMapper orderMapper;
    private final AdminAccessService accessService;

    public AdminUserService(AppUserMapper userMapper, TripMapper tripMapper, BizOrderMapper orderMapper,
                            AdminAccessService accessService) {
        this.userMapper = userMapper;
        this.tripMapper = tripMapper;
        this.orderMapper = orderMapper;
        this.accessService = accessService;
    }

    public PageResult<AdminUserVO> list(String keyword, String status, String channel, long page, long pageSize) {
        accessService.require(AdminAccessService.ALL, "当前角色无用户查看权限");
        int current = safePage(page);
        int size = safePageSize(pageSize);
        LambdaQueryWrapper<AppUser> query = new LambdaQueryWrapper<AppUser>()
                .eq("active".equals(status), AppUser::getStatus, "normal")
                .eq("disabled".equals(status), AppUser::getStatus, "disabled")
                .eq(notBlank(channel), AppUser::getRegisterChannel, channel)
                .and(notBlank(keyword), q -> q.like(AppUser::getNickname, keyword)
                        .or().like(AppUser::getPhone, keyword))
                .orderByDesc(AppUser::getCreatedAt).orderByDesc(AppUser::getId);
        Page<AppUser> pageResult = userMapper.selectPage(new Page<>(current, size), query);
        List<AppUser> users = pageResult.getRecords();
        if (users.isEmpty()) return PageResult.of(Collections.emptyList(), pageResult.getTotal(), current, size);

        List<Long> userIds = users.stream().map(AppUser::getId).toList();
        Map<Long, List<Trip>> trips = tripMapper.selectList(new LambdaQueryWrapper<Trip>()
                        .in(Trip::getUserId, userIds).eq(Trip::getValidity, "valid"))
                .stream().collect(Collectors.groupingBy(Trip::getUserId));
        Map<Long, List<BizOrder>> orders = orderMapper.selectList(new LambdaQueryWrapper<BizOrder>()
                        .in(BizOrder::getUserId, userIds).in(BizOrder::getStatus, List.of("paid", "opened")))
                .stream().collect(Collectors.groupingBy(BizOrder::getUserId));

        List<AdminUserVO> result = users.stream().map(user -> toVO(user,
                trips.getOrDefault(user.getId(), List.of()), orders.getOrDefault(user.getId(), List.of()))).toList();
        return PageResult.of(result, pageResult.getTotal(), current, size);
    }

    private AdminUserVO toVO(AppUser user, List<Trip> trips, List<BizOrder> orders) {
        int savedCent = trips.stream().mapToInt(t -> safe(t.getValueCent()) - safe(t.getPriceCent())).sum();
        int spendCent = orders.stream().mapToInt(o -> safe(o.getPaidCent())).sum();
        AdminUserVO vo = new AdminUserVO();
        vo.setId(user.getId());
        vo.setNickname(user.getNickname());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setPhone(maskPhone(user.getPhone()));
        vo.setWechatNickname("wechat".equals(user.getRegisterChannel()) ? user.getNickname() : null);
        vo.setChannel(user.getRegisterChannel());
        vo.setTripCount(trips.size());
        vo.setTitle(title(trips.size()));
        vo.setSpendTotal(yuan(spendCent));
        vo.setSavedTotal(yuan(savedCent));
        vo.setStatus("normal".equals(user.getStatus()) ? "active" : "disabled");
        vo.setPersonalityType(user.getPersonalityType());
        vo.setLastLoginAt(user.getLastLoginAt());
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }

    private static int safe(Integer value) { return value == null ? 0 : value; }
    private static BigDecimal yuan(int cent) { return BigDecimal.valueOf(cent).movePointLeft(2).setScale(2, RoundingMode.HALF_UP); }
    private static String title(int count) { return count >= 8 ? "旅行家" : count >= 3 ? "探索者" : "旅行新手"; }
    private static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) return "未绑定";
        return phone.length() >= 7 ? phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4) : phone;
    }
    private static boolean notBlank(String value) { return value != null && !value.isBlank(); }
    private static int safePage(long page) { return (int) Math.max(1, page); }
    private static int safePageSize(long pageSize) { return (int) Math.min(100, Math.max(1, pageSize)); }
}
