package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.tuge.common.biz.BizNoGenerator;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.dto.CreateOrderRequest;
import com.tuge.domain.dto.PayRequest;
import com.tuge.domain.dto.RefundRequest;
import com.tuge.domain.entity.Badge;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.entity.PaymentFlow;
import com.tuge.domain.entity.RefundOrder;
import com.tuge.domain.entity.TravelRoute;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.entity.UserBadge;
import com.tuge.domain.mapper.BadgeMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.PaymentFlowMapper;
import com.tuge.domain.mapper.RefundOrderMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.vo.OrderVO;
import com.tuge.domain.vo.PayVO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class OrderService {

    private final BizOrderMapper orderMapper;
    private final BlindBoxMapper boxMapper;
    private final TravelRouteMapper routeMapper;
    private final TripMapper tripMapper;
    private final BadgeMapper badgeMapper;
    private final UserBadgeMapper userBadgeMapper;
    private final PaymentFlowMapper paymentFlowMapper;
    private final RefundOrderMapper refundMapper;
    private final BizNoGenerator bizNoGenerator;
    private final boolean mockEnabled;

    public OrderService(BizOrderMapper orderMapper, BlindBoxMapper boxMapper,
                        TravelRouteMapper routeMapper, TripMapper tripMapper,
                        BadgeMapper badgeMapper, UserBadgeMapper userBadgeMapper,
                        PaymentFlowMapper paymentFlowMapper, RefundOrderMapper refundMapper,
                        BizNoGenerator bizNoGenerator,
                        @Value("${pay.mock-enabled:false}") boolean mockEnabled) {
        this.orderMapper = orderMapper;
        this.boxMapper = boxMapper;
        this.routeMapper = routeMapper;
        this.tripMapper = tripMapper;
        this.badgeMapper = badgeMapper;
        this.userBadgeMapper = userBadgeMapper;
        this.paymentFlowMapper = paymentFlowMapper;
        this.refundMapper = refundMapper;
        this.bizNoGenerator = bizNoGenerator;
        this.mockEnabled = mockEnabled;
    }

    @Transactional
    public OrderVO create(Long userId, CreateOrderRequest request) {
        expirePendingOrders(userId);
        BlindBox box = boxMapper.selectById(request.boxId());
        if (box == null || !"on".equals(box.getStatus())) {
            throw new BusinessException(404, "盲盒不存在或已下架");
        }
        BizOrder active = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>()
                .eq(BizOrder::getUserId, userId)
                .eq(BizOrder::getBoxId, request.boxId())
                .in(BizOrder::getStatus, List.of("pending_pay", "paid"))
                .last("LIMIT 1"));
        if (active != null) throw new BusinessException(409, "该盲盒已有未完成订单");

        BizOrder order = new BizOrder();
        order.setOrderNo(bizNoGenerator.generate("T"));
        order.setUserId(userId);
        order.setBoxId(box.getId());
        order.setBoxName(box.getName());
        order.setBoxCategory(box.getCategory());
        order.setPriceCent(box.getPriceCent());
        order.setPaidCent(0);
        order.setMinValueCent(box.getMinValueCent());
        order.setStatus("pending_pay");
        order.setExpireAt(LocalDateTime.now().plusMinutes(15));
        order.setVersion(0);
        try {
            orderMapper.insert(order);
        } catch (DuplicateKeyException e) {
            throw new BusinessException(409, "该盲盒已有未完成订单");
        }
        return toVO(order);
    }

    public PageResult<OrderVO> list(Long userId, String status, long page, long pageSize) {
        expirePendingOrders(userId);
        Page<BizOrder> result = new Page<>(safePage(page), safePageSize(pageSize));
        LambdaQueryWrapper<BizOrder> query = new LambdaQueryWrapper<BizOrder>()
                .eq(BizOrder::getUserId, userId)
                .eq(status != null && !status.isBlank(), BizOrder::getStatus, status)
                .orderByDesc(BizOrder::getCreatedAt);
        Page<BizOrder> rows = orderMapper.selectPage(result, query);
        return PageResult.of(rows.getRecords().stream().map(this::toVO).toList(), rows.getTotal(),
                rows.getCurrent(), rows.getSize());
    }

    public OrderVO detail(Long userId, String orderNo) {
        BizOrder order = findUserOrder(userId, orderNo);
        expire(order);
        return toVO(order);
    }

    @Transactional
    public void cancel(Long userId, String orderNo) {
        BizOrder order = findUserOrder(userId, orderNo);
        if (!"pending_pay".equals(order.getStatus())) {
            throw new BusinessException(409, "当前订单不可取消");
        }
        order.setStatus("cancelled");
        order.setCancelledAt(LocalDateTime.now());
        orderMapper.updateById(order);
    }

    @Transactional
    public PayVO pay(Long userId, String orderNo, PayRequest request) {
        BizOrder order = findUserOrder(userId, orderNo);
        expire(order);
        if (!"pending_pay".equals(order.getStatus())) {
            if ("opened".equals(order.getStatus())) throw new BusinessException(409, "订单已完成支付");
            throw new BusinessException(409, "当前订单不可支付");
        }
        if (!mockEnabled) {
            throw new BusinessException(503, "支付宝沙箱尚未配置，请先配置支付密钥");
        }
        markPaid(order);
        openBox(order);
        PayVO result = new PayVO();
        result.setPayUrl("mock://tuge/pay/" + orderNo);
        result.setQrCodeUrl("");
        result.setMock(true);
        result.setStatus(order.getStatus());
        return result;
    }

    @Transactional
    public RefundOrder requestRefund(Long userId, String orderNo, RefundRequest request) {
        BizOrder order = findUserOrder(userId, orderNo);
        if (!List.of("paid", "opened").contains(order.getStatus())) {
            throw new BusinessException(409, "当前订单不可申请退款");
        }
        RefundOrder existing = refundMapper.selectOne(new LambdaQueryWrapper<RefundOrder>()
                .eq(RefundOrder::getOrderId, order.getId())
                .in(RefundOrder::getStatus, List.of("pending_review", "approved", "auto"))
                .last("LIMIT 1"));
        if (existing != null) throw new BusinessException(409, "该订单已有退款申请");
        RefundOrder refund = new RefundOrder();
        refund.setRefundNo(bizNoGenerator.generate("R"));
        refund.setOrderId(order.getId());
        refund.setOrderNo(order.getOrderNo());
        refund.setUserId(userId);
        refund.setAmountCent(order.getPaidCent());
        refund.setReason(request.reason().trim());
        refund.setKind(request.kind());
        refund.setStatus("pending_review");
        refundMapper.insert(refund);
        return refund;
    }

    public BizOrder findUserOrder(Long userId, String orderNo) {
        BizOrder order = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>()
                .eq(BizOrder::getUserId, userId).eq(BizOrder::getOrderNo, orderNo));
        if (order == null) throw new BusinessException(404, "订单不存在");
        return order;
    }

    @Transactional
    public void expirePendingOrders(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LambdaUpdateWrapper<BizOrder> update = new LambdaUpdateWrapper<BizOrder>()
                .eq(BizOrder::getStatus, "pending_pay")
                .lt(BizOrder::getExpireAt, now)
                .set(BizOrder::getStatus, "cancelled")
                .set(BizOrder::getCancelledAt, now);
        if (userId != null) update.eq(BizOrder::getUserId, userId);
        orderMapper.update(null, update);
    }

    @Transactional
    public void expireAll() {
        expirePendingOrders(null);
    }

    @Transactional
    void markPaid(BizOrder order) {
        LocalDateTime now = LocalDateTime.now();
        order.setStatus("paid");
        order.setPaidCent(order.getPriceCent());
        order.setPayChannel("mock");
        order.setPaidAt(now);
        orderMapper.updateById(order);
        PaymentFlow flow = new PaymentFlow();
        flow.setFlowNo(bizNoGenerator.generate("F"));
        flow.setOrderId(order.getId());
        flow.setOrderNo(order.getOrderNo());
        flow.setChannel("mock");
        flow.setChannelTradeNo("MOCK-" + order.getOrderNo());
        flow.setAmountCent(order.getPriceCent());
        flow.setResult("success");
        flow.setNotifyId("MOCK-NOTIFY-" + order.getOrderNo());
        paymentFlowMapper.insert(flow);
    }

    @Transactional
    void openBox(BizOrder order) {
        List<TravelRoute> candidates = routeMapper.selectList(new LambdaQueryWrapper<TravelRoute>()
                .eq(TravelRoute::getCategory, order.getBoxCategory())
                .eq(TravelRoute::getStatus, "on")
                .ge(TravelRoute::getValueCent, order.getMinValueCent()));
        if (candidates.isEmpty()) {
            createAutoRefund(order, "池中无线路满足保底");
            return;
        }
        Collections.shuffle(candidates);
        TravelRoute route = candidates.get(0);
        Badge badge = badgeMapper.selectById(route.getBadgeId());
        LocalDateTime now = LocalDateTime.now();
        Trip trip = new Trip();
        trip.setUserId(order.getUserId());
        trip.setOrderId(order.getId());
        trip.setRouteId(route.getId());
        trip.setBoxId(order.getBoxId());
        trip.setBoxName(order.getBoxName());
        trip.setBoxCategory(order.getBoxCategory());
        trip.setPriceCent(order.getPriceCent());
        trip.setRouteName(route.getName());
        trip.setLocation(route.getLocation());
        trip.setValueCent(route.getValueCent());
        trip.setHighlight(route.getHighlight());
        trip.setIncludeJson(route.getIncludeJson());
        trip.setMoodText(route.getMoodText());
        trip.setBadgeName(badge == null ? "旅行足迹" : badge.getName());
        trip.setValidity("valid");
        trip.setOpenedDate(LocalDate.now());
        tripMapper.insert(trip);

        order.setStatus("opened");
        order.setOpenedAt(now);
        order.setRouteId(route.getId());
        order.setTripId(trip.getId());
        orderMapper.updateById(order);
        boxMapper.update(null, new LambdaUpdateWrapper<BlindBox>()
                .eq(BlindBox::getId, order.getBoxId()).setSql("open_count = open_count + 1"));
        routeMapper.update(null, new LambdaUpdateWrapper<TravelRoute>()
                .eq(TravelRoute::getId, route.getId()).setSql("draw_count = draw_count + 1"));
        if (badge != null && userBadgeMapper.selectOne(new LambdaQueryWrapper<UserBadge>()
                .eq(UserBadge::getUserId, order.getUserId()).eq(UserBadge::getBadgeId, badge.getId())) == null) {
            UserBadge userBadge = new UserBadge();
            userBadge.setUserId(order.getUserId());
            userBadge.setBadgeId(badge.getId());
            userBadge.setSourceTripId(trip.getId());
            userBadgeMapper.insert(userBadge);
        }
    }

    private void createAutoRefund(BizOrder order, String reason) {
        RefundOrder refund = new RefundOrder();
        refund.setRefundNo(bizNoGenerator.generate("R"));
        refund.setOrderId(order.getId());
        refund.setOrderNo(order.getOrderNo());
        refund.setUserId(order.getUserId());
        refund.setAmountCent(order.getPaidCent());
        refund.setReason(reason);
        refund.setKind("draw_fail");
        refund.setStatus("auto");
        refund.setChannelRefundNo("MOCK-REFUND-" + order.getOrderNo());
        refundMapper.insert(refund);
        order.setStatus("refunded");
        orderMapper.updateById(order);
    }

    private void expire(BizOrder order) {
        if ("pending_pay".equals(order.getStatus()) && order.getExpireAt() != null
                && order.getExpireAt().isBefore(LocalDateTime.now())) {
            order.setStatus("cancelled");
            order.setCancelledAt(LocalDateTime.now());
            orderMapper.updateById(order);
        }
    }

    private OrderVO toVO(BizOrder order) {
        OrderVO vo = new OrderVO();
        vo.setOrderNo(order.getOrderNo());
        vo.setBoxId(order.getBoxId());
        vo.setBoxName(order.getBoxName());
        vo.setBoxCategory(order.getBoxCategory());
        vo.setPriceCent(order.getPriceCent());
        vo.setPaidCent(order.getPaidCent());
        vo.setStatus(order.getStatus());
        vo.setPayChannel(order.getPayChannel());
        vo.setExpireAt(order.getExpireAt());
        vo.setPaidAt(order.getPaidAt());
        vo.setOpenedAt(order.getOpenedAt());
        vo.setTripId(order.getTripId());
        vo.setRouteId(order.getRouteId());
        if (order.getRouteId() != null) {
            TravelRoute route = routeMapper.selectById(order.getRouteId());
            if (route != null) {
                vo.setRouteName(route.getName());
                vo.setLocation(route.getLocation());
                vo.setRouteValueCent(route.getValueCent());
                vo.setMoodText(route.getMoodText());
            }
        }
        RefundOrder refund = refundMapper.selectOne(new LambdaQueryWrapper<RefundOrder>()
                .eq(RefundOrder::getOrderId, order.getId()).orderByDesc(RefundOrder::getCreatedAt).last("LIMIT 1"));
        if (refund != null) vo.setRefundNo(refund.getRefundNo());
        return vo;
    }

    private int safePage(long page) { return (int) Math.max(1, page); }

    private int safePageSize(long pageSize) { return (int) Math.min(100, Math.max(1, pageSize)); }
}
