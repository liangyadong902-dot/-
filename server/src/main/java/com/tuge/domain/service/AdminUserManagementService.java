package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.AdminUserNoteRequest;
import com.tuge.domain.dto.AdminUserStatusRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.AdminOrderVO;
import com.tuge.domain.vo.AdminTripVO;
import com.tuge.domain.vo.AdminUserDetailVO;
import com.tuge.domain.vo.UserStatsVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminUserManagementService {
    private final AppUserMapper userMapper;
    private final TripMapper tripMapper;
    private final BizOrderMapper orderMapper;
    private final UserStatsService statsService;
    private final BadgeService badgeService;
    private final AdminAccessService accessService;
    private final AdminAuditService auditService;

    public AdminUserManagementService(AppUserMapper userMapper, TripMapper tripMapper, BizOrderMapper orderMapper,
                                      UserStatsService statsService, BadgeService badgeService,
                                      AdminAccessService accessService, AdminAuditService auditService) {
        this.userMapper = userMapper;
        this.tripMapper = tripMapper;
        this.orderMapper = orderMapper;
        this.statsService = statsService;
        this.badgeService = badgeService;
        this.accessService = accessService;
        this.auditService = auditService;
    }

    public AdminUserDetailVO detail(Long id) {
        accessService.require(AdminAccessService.ALL, "当前角色无用户查看权限");
        AppUser user = find(id);
        List<Trip> trips = tripMapper.selectList(new LambdaQueryWrapper<Trip>()
                .eq(Trip::getUserId, id).orderByDesc(Trip::getOpenedDate).last("LIMIT 10"));
        List<BizOrder> orders = orderMapper.selectList(new LambdaQueryWrapper<BizOrder>()
                .eq(BizOrder::getUserId, id).orderByDesc(BizOrder::getCreatedAt).last("LIMIT 10"));
        UserStatsVO stats = statsService.get(id);
        AdminUserDetailVO vo = new AdminUserDetailVO();
        fillBase(vo, user, stats);
        vo.setCity(user.getCity());
        vo.setGender(user.getGender());
        vo.setRecentMood(stats.getRecentMood());
        vo.setStats(stats);
        vo.setBadges(badgeService.listAll(id).getList());
        vo.setRecentOrders(orders.stream().map(row -> toOrder(row, user)).toList());
        vo.setRecentTrips(trips.stream().map(row -> toTrip(row, user)).toList());
        vo.setCsNote(user.getCsNote());
        vo.setDisableReason(user.getDisabledReason());
        return vo;
    }

    @Transactional
    public void updateStatus(Long id, AdminUserStatusRequest request) {
        accessService.require(AdminAccessService.USER_WRITE, "当前角色无用户状态修改权限");
        AppUser user = find(id);
        if ("disabled".equals(request.status()) && (request.reason() == null || request.reason().isBlank())) {
            throw new BusinessException(400, "禁用原因必填");
        }
        String before = user.getStatus();
        user.setStatus("active".equals(request.status()) ? "normal" : "disabled");
        user.setDisabledReason("disabled".equals(request.status()) ? request.reason().trim() : null);
        userMapper.updateById(user);
        auditService.record("active".equals(request.status()) ? "user_enable" : "user_disable", "user", id,
                Map.of("before", before, "after", user.getStatus(), "reason", user.getDisabledReason() == null ? "" : user.getDisabledReason()));
    }

    @Transactional
    public void updateNote(Long id, AdminUserNoteRequest request) {
        accessService.require(AdminAccessService.USER_WRITE, "当前角色无客服备注修改权限");
        AppUser user = find(id);
        String before = user.getCsNote();
        user.setCsNote(request.note() == null ? null : request.note().trim());
        userMapper.updateById(user);
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("before", before);
        detail.put("after", user.getCsNote());
        auditService.record("user_note", "user", id, detail);
    }

    public String export(String keyword, String status, String channel) {
        accessService.require(AdminAccessService.EXPORT, "当前角色无用户导出权限");
        List<AppUser> users = userMapper.selectList(new LambdaQueryWrapper<AppUser>()
                .eq("active".equals(status), AppUser::getStatus, "normal")
                .eq("disabled".equals(status), AppUser::getStatus, "disabled")
                .eq(notBlank(channel), AppUser::getRegisterChannel, channel)
                .and(notBlank(keyword), q -> q.like(AppUser::getNickname, keyword).or().like(AppUser::getPhone, keyword))
                .orderByDesc(AppUser::getCreatedAt));
        DateTimeFormatter format = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        StringBuilder csv = new StringBuilder("\uFEFF用户ID,昵称,手机号,渠道,状态,人格,注册时间\n");
        for (AppUser user : users) {
            csv.append(user.getId()).append(',').append(csv(user.getNickname())).append(',')
                    .append(csv(user.getPhone())).append(',').append(csv(user.getRegisterChannel())).append(',')
                    .append("normal".equals(user.getStatus()) ? "active" : "disabled").append(',')
                    .append(csv(user.getPersonalityType())).append(',')
                    .append(user.getCreatedAt() == null ? "" : user.getCreatedAt().format(format)).append('\n');
        }
        return csv.toString();
    }

    private AppUser find(Long id) {
        AppUser user = userMapper.selectById(id);
        if (user == null) throw new BusinessException(404, "用户不存在");
        return user;
    }

    private void fillBase(AdminUserDetailVO vo, AppUser user, UserStatsVO stats) {
        vo.setId(user.getId()); vo.setNickname(user.getNickname()); vo.setAvatarUrl(user.getAvatarUrl());
        vo.setPhone(maskPhone(user.getPhone()));
        vo.setWechatNickname("wechat".equals(user.getRegisterChannel()) ? user.getNickname() : null);
        vo.setChannel(user.getRegisterChannel()); vo.setTripCount(stats.getTripCount()); vo.setTitle(stats.getTitle());
        vo.setSpendTotal(stats.getSpendTotal()); vo.setSavedTotal(stats.getSavedTotal());
        vo.setStatus("normal".equals(user.getStatus()) ? "active" : "disabled");
        vo.setPersonalityType(user.getPersonalityType()); vo.setLastLoginAt(user.getLastLoginAt()); vo.setCreatedAt(user.getCreatedAt());
    }

    private AdminOrderVO toOrder(BizOrder row, AppUser user) {
        AdminOrderVO vo = new AdminOrderVO();
        vo.setOrderNo(row.getOrderNo()); vo.setUserId(row.getUserId()); vo.setUserName(user.getNickname());
        vo.setPhone(maskPhone(user.getPhone())); vo.setBoxName(row.getBoxName()); vo.setPriceCent(row.getPriceCent());
        vo.setPaidCent(row.getPaidCent()); vo.setStatus(row.getStatus()); vo.setPayChannel(row.getPayChannel());
        vo.setTripId(row.getTripId()); vo.setCreatedAt(row.getCreatedAt()); vo.setPaidAt(row.getPaidAt()); vo.setOpenedAt(row.getOpenedAt());
        return vo;
    }

    private AdminTripVO toTrip(Trip row, AppUser user) {
        AdminTripVO vo = new AdminTripVO();
        vo.setId(row.getId()); vo.setUserId(row.getUserId()); vo.setUserName(user.getNickname());
        vo.setRouteId(row.getRouteId()); vo.setRouteName(row.getRouteName()); vo.setLocation(row.getLocation());
        vo.setBoxName(row.getBoxName()); vo.setPriceCent(row.getPriceCent()); vo.setValueCent(row.getValueCent());
        vo.setValidity(row.getValidity()); vo.setOpenedDate(row.getOpenedDate());
        return vo;
    }

    private static boolean notBlank(String value) { return value != null && !value.isBlank(); }
    private static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) return "未绑定";
        return phone.length() >= 7 ? phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4) : phone;
    }
    private static String csv(String value) {
        if (value == null) return "";
        return value.contains(",") || value.contains("\"") || value.contains("\n")
                ? "\"" + value.replace("\"", "\"\"") + "\"" : value;
    }
}
