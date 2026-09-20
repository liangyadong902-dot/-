package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.RefundOrder;
import com.tuge.domain.entity.PaymentFlow;
import com.tuge.domain.entity.TravelRoute;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.RefundOrderMapper;
import com.tuge.domain.mapper.PaymentFlowMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.AdminOrderVO;
import com.tuge.domain.vo.AdminRefundVO;
import com.tuge.domain.vo.AdminPaymentFlowVO;
import com.tuge.domain.vo.AdminTripVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class AdminTransactionService {

    /** 退款审核、驳回：super_admin / finance / cs。 */
    private static final Set<String> REFUND_ROLES = Set.of("super_admin", "finance", "cs");
    /** 补单 reopen：super_admin / cs。 */
    private static final Set<String> REOPEN_ROLES = Set.of("super_admin", "cs");
    /** 订单/行程/流水只读：所有管理端业务角色。 */
    private static final Set<String> READ_ROLES = Set.of("super_admin", "operator", "cs", "finance", "analyst");
    /** 订单导出：super_admin / finance / analyst。 */
    private static final Set<String> EXPORT_ROLES = Set.of("super_admin", "finance", "analyst");

    private final BizOrderMapper orderMapper;
    private final RefundOrderMapper refundMapper;
    private final AppUserMapper userMapper;
    private final TravelRouteMapper routeMapper;
    private final TripMapper tripMapper;
    private final PaymentFlowMapper paymentFlowMapper;
    private final AlipaySandboxClient alipayClient;
    private final OrderService orderService;

    public AdminTransactionService(BizOrderMapper orderMapper, RefundOrderMapper refundMapper,
                                   AppUserMapper userMapper, TravelRouteMapper routeMapper,
                                   TripMapper tripMapper, PaymentFlowMapper paymentFlowMapper,
                                   AlipaySandboxClient alipayClient, OrderService orderService) {
        this.orderMapper = orderMapper;
        this.refundMapper = refundMapper;
        this.userMapper = userMapper;
        this.routeMapper = routeMapper;
        this.tripMapper = tripMapper;
        this.paymentFlowMapper = paymentFlowMapper;
        this.alipayClient = alipayClient;
        this.orderService = orderService;
    }

    public PageResult<AdminOrderVO> listOrders(String orderNo, Long userId, String status, String keyword,
                                               String channel, String from, String to,
                                               long page, long pageSize) {
        requireRole(READ_ROLES, "当前角色无订单查看权限");
        Page<BizOrder> result = new Page<>(safePage(page), safePageSize(pageSize));
        LambdaQueryWrapper<BizOrder> query = new LambdaQueryWrapper<BizOrder>()
                .like(notBlank(orderNo), BizOrder::getOrderNo, orderNo)
                .eq(userId != null, BizOrder::getUserId, userId)
                .eq(notBlank(status), BizOrder::getStatus, status)
                .eq(notBlank(channel), BizOrder::getPayChannel, channel)
                .ge(notBlank(from), BizOrder::getCreatedAt, parseTime(from))
                .le(notBlank(to), BizOrder::getCreatedAt, parseEndTime(to))
                .orderByDesc(BizOrder::getCreatedAt);
        // 关键字：单号 / 昵称 / 手机
        if (notBlank(keyword)) {
            List<Long> userIds = userMapper.selectList(new LambdaQueryWrapper<AppUser>()
                            .like(AppUser::getNickname, keyword)
                            .or().like(AppUser::getPhone, keyword))
                    .stream().map(AppUser::getId).toList();
            query.and(q -> {
                q.like(BizOrder::getOrderNo, keyword);
                if (!userIds.isEmpty()) q.or().in(BizOrder::getUserId, userIds);
            });
        }
        Page<BizOrder> rows = orderMapper.selectPage(result, query);
        return PageResult.of(rows.getRecords().stream().map(this::toOrder).toList(), rows.getTotal(),
                rows.getCurrent(), rows.getSize());
    }

    public AdminOrderVO order(String orderNo) {
        requireRole(READ_ROLES, "当前角色无订单查看权限");
        BizOrder row = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getOrderNo, orderNo));
        if (row == null) throw new BusinessException(404, "订单不存在");
        return toOrder(row);
    }

    /** CSV 导出（按当前筛选），无 BOM 中文表头。 */
    public String exportOrders(String orderNo, Long userId, String status, String keyword,
                               String channel, String from, String to) {
        requireRole(EXPORT_ROLES, "当前角色无订单导出权限");
        PageResult<AdminOrderVO> result = listOrders(orderNo, userId, status, keyword, channel, from, to, 1, 10000);
        StringBuilder csv = new StringBuilder();
        csv.append("订单号,用户ID,用户昵称,手机号,盲盒,应付(元),实付(元),状态,渠道,开盒线路,创建时间,支付时间\n");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (AdminOrderVO o : result.getList()) {
            csv.append(join(",", nv(o.getOrderNo()), String.valueOf(o.getUserId()), nv(o.getUserName()),
                    nv(o.getPhone()), nv(o.getBoxName()),
                    yuan(o.getPriceCent()), yuan(o.getPaidCent()), nv(o.getStatus()), nv(o.getPayChannel()),
                    nv(o.getRouteName()),
                    o.getCreatedAt() == null ? "" : o.getCreatedAt().format(fmt),
                    o.getPaidAt() == null ? "" : o.getPaidAt().format(fmt)))
                    .append('\n');
        }
        return csv.toString();
    }

    /**
     * 补单：渠道已成功、系统停在 paid 且无行程时，重入开盒事务。幂等。
     */
    @Transactional
    public AdminOrderVO reopen(String orderNo) {
        requireRole(REOPEN_ROLES, "当前角色无补单权限");
        BizOrder order = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getOrderNo, orderNo));
        if (order == null) throw new BusinessException(404, "订单不存在");
        if (!"paid".equals(order.getStatus()) || order.getTripId() != null) {
            throw new BusinessException(409, "仅「已支付且未开盒」订单可补单");
        }
        orderService.openBox(order);
        BizOrder reloaded = orderMapper.selectById(order.getId());
        return toOrder(reloaded);
    }

    public PageResult<AdminRefundVO> listRefunds(String status, String kind, long page, long pageSize) {
        requireRole(READ_ROLES, "当前角色无退款查看权限");
        Page<RefundOrder> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<RefundOrder> rows = refundMapper.selectPage(result, new LambdaQueryWrapper<RefundOrder>()
                .eq(notBlank(status), RefundOrder::getStatus, status)
                .eq(notBlank(kind), RefundOrder::getKind, kind)
                .orderByDesc(RefundOrder::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(this::toRefund).toList(), rows.getTotal(),
                rows.getCurrent(), rows.getSize());
    }

    public AdminRefundVO refund(String refundNo) {
        requireRole(READ_ROLES, "当前角色无退款查看权限");
        return toRefund(findRefund(refundNo));
    }

    public PageResult<AdminPaymentFlowVO> listPaymentFlows(String orderNo, String channel, String result,
                                                           long page, long pageSize) {
        requireRole(READ_ROLES, "当前角色无支付流水查看权限");
        Page<PaymentFlow> p = new Page<>(safePage(page), safePageSize(pageSize));
        Page<PaymentFlow> rows = paymentFlowMapper.selectPage(p, new LambdaQueryWrapper<PaymentFlow>()
                .eq(notBlank(orderNo), PaymentFlow::getOrderNo, orderNo)
                .eq(notBlank(channel), PaymentFlow::getChannel, channel)
                .eq(notBlank(result), PaymentFlow::getResult, result)
                .orderByDesc(PaymentFlow::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(row -> {
            AdminPaymentFlowVO vo = new AdminPaymentFlowVO();
            vo.setFlowNo(row.getFlowNo()); vo.setOrderNo(row.getOrderNo()); vo.setChannel(row.getChannel());
            vo.setChannelTradeNo(row.getChannelTradeNo()); vo.setAmountCent(row.getAmountCent());
            vo.setResult(row.getResult()); vo.setCreatedAt(row.getCreatedAt());
            return vo;
        }).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public PageResult<AdminTripVO> listTrips(String validity, Long routeId, long page, long pageSize) {
        requireRole(READ_ROLES, "当前角色无行程查看权限");
        Page<Trip> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<Trip> rows = tripMapper.selectPage(result, new LambdaQueryWrapper<Trip>()
                .eq(notBlank(validity), Trip::getValidity, validity)
                .eq(routeId != null, Trip::getRouteId, routeId)
                .orderByDesc(Trip::getOpenedDate).orderByDesc(Trip::getId));
        return PageResult.of(rows.getRecords().stream().map(this::toTrip).toList(), rows.getTotal(),
                rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public void approve(String refundNo) {
        requireRole(REFUND_ROLES, "当前角色无退款审核权限");
        RefundOrder refund = findRefund(refundNo);
        if (!"pending_review".equals(refund.getStatus())) throw new BusinessException(409, "退款单当前不可审核");
        BizOrder order = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getId, refund.getOrderId()));
        if (order == null) throw new BusinessException(404, "退款单关联订单不存在");
        // 原路退回：真实渠道必须调沙箱退款成功才落 refunded
        if ("alipay".equals(order.getPayChannel())) {
            if (!alipayClient.isConfigured()) {
                throw new BusinessException(503, "支付宝沙箱未配置，无法原路退款");
            }
            refund.setChannelRefundNo(alipayClient.refund(order.getOrderNo(), refund.getRefundNo(), refund.getAmountCent()));
        } else {
            refund.setChannelRefundNo("MOCK-REFUND-" + order.getOrderNo());
        }
        refund.setStatus("approved");
        refund.setReviewerId(JwtContext.getUserId());
        refund.setReviewedAt(LocalDateTime.now());
        refundMapper.updateById(refund);
        order.setStatus("refunded");
        orderMapper.updateById(order);
        Trip trip = tripMapper.selectOne(new LambdaQueryWrapper<Trip>().eq(Trip::getOrderId, order.getId()));
        if (trip != null) {
            trip.setValidity("invalid");
            tripMapper.updateById(trip);
        }
    }

    @Transactional
    public void reject(String refundNo, String reason) {
        requireRole(REFUND_ROLES, "当前角色无退款审核权限");
        RefundOrder refund = findRefund(refundNo);
        if (!"pending_review".equals(refund.getStatus())) throw new BusinessException(409, "退款单当前不可审核");
        refund.setStatus("rejected");
        refund.setRejectReason(reason == null || reason.isBlank() ? "审核未通过" : reason.trim());
        refund.setReviewerId(JwtContext.getUserId());
        refund.setReviewedAt(LocalDateTime.now());
        refundMapper.updateById(refund);
    }

    private void requireRole(Set<String> roles, String message) {
        if (!roles.contains(JwtContext.getRole())) {
            throw new BusinessException(403, message);
        }
    }

    private RefundOrder findRefund(String no) {
        RefundOrder refund = refundMapper.selectOne(new LambdaQueryWrapper<RefundOrder>().eq(RefundOrder::getRefundNo, no));
        if (refund == null) throw new BusinessException(404, "退款单不存在");
        return refund;
    }

    private AdminOrderVO toOrder(BizOrder row) {
        AdminOrderVO vo = new AdminOrderVO();
        vo.setOrderNo(row.getOrderNo());
        vo.setUserId(row.getUserId());
        AppUser user = userMapper.selectById(row.getUserId());
        if (user != null) { vo.setUserName(user.getNickname()); vo.setPhone(user.getPhone()); }
        vo.setBoxName(row.getBoxName()); vo.setPriceCent(row.getPriceCent()); vo.setPaidCent(row.getPaidCent());
        vo.setStatus(row.getStatus()); vo.setPayChannel(row.getPayChannel()); vo.setTripId(row.getTripId());
        vo.setCreatedAt(row.getCreatedAt()); vo.setPaidAt(row.getPaidAt()); vo.setOpenedAt(row.getOpenedAt());
        if (row.getRouteId() != null) {
            TravelRoute route = routeMapper.selectById(row.getRouteId());
            if (route != null) vo.setRouteName(route.getName());
        }
        return vo;
    }

    private AdminRefundVO toRefund(RefundOrder row) {
        AdminRefundVO vo = new AdminRefundVO();
        vo.setRefundNo(row.getRefundNo()); vo.setOrderNo(row.getOrderNo()); vo.setUserId(row.getUserId());
        AppUser user = userMapper.selectById(row.getUserId());
        if (user != null) vo.setUserName(user.getNickname());
        vo.setAmountCent(row.getAmountCent()); vo.setReason(row.getReason()); vo.setKind(row.getKind());
        vo.setStatus(row.getStatus()); vo.setRejectReason(row.getRejectReason()); vo.setCreatedAt(row.getCreatedAt()); vo.setReviewedAt(row.getReviewedAt());
        return vo;
    }

    private AdminTripVO toTrip(Trip row) {
        AdminTripVO vo = new AdminTripVO();
        vo.setId(row.getId());
        vo.setUserId(row.getUserId());
        AppUser user = userMapper.selectById(row.getUserId());
        if (user != null) vo.setUserName(user.getNickname());
        vo.setOrderNo("");
        if (row.getOrderId() != null) {
            BizOrder order = orderMapper.selectById(row.getOrderId());
            if (order != null) vo.setOrderNo(order.getOrderNo());
        }
        vo.setRouteId(row.getRouteId());
        vo.setRouteName(row.getRouteName());
        vo.setLocation(row.getLocation());
        vo.setBoxName(row.getBoxName());
        vo.setPriceCent(row.getPriceCent());
        vo.setValueCent(row.getValueCent());
        vo.setValidity(row.getValidity());
        vo.setOpenedDate(row.getOpenedDate());
        return vo;
    }

    private LocalDateTime parseTime(String value) {
        if (!notBlank(value)) return null;
        try {
            return value.length() == 10 ? LocalDateTime.parse(value + "T00:00:00") : LocalDateTime.parse(value);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseEndTime(String value) {
        if (!notBlank(value)) return null;
        return parseTime(value.length() == 10 ? value + "T23:59:59" : value);
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private String nv(String value) {
        return value == null ? "" : value;
    }

    private String yuan(Integer cent) {
        return cent == null ? "0.00" : String.format("%.2f", cent / 100.0);
    }

    private String join(String sep, String... parts) {
        List<String> escaped = new ArrayList<>();
        for (String p : parts) {
            String v = p == null ? "" : p;
            if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
                v = "\"" + v.replace("\"", "\"\"") + "\"";
            }
            escaped.add(v);
        }
        return String.join(sep, escaped);
    }

    private int safePage(long page) { return (int) Math.max(1, page); }
    private int safePageSize(long size) { return (int) Math.min(10000, Math.max(1, size)); }
}
