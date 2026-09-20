package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.biz.BizNoGenerator;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.exception.DuplicateNotifyException;
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
    private final AlipaySandboxClient alipayClient;
    private final boolean mockEnabled;

    public OrderService(BizOrderMapper orderMapper, BlindBoxMapper boxMapper,
                        TravelRouteMapper routeMapper, TripMapper tripMapper,
                        BadgeMapper badgeMapper, UserBadgeMapper userBadgeMapper,
                        PaymentFlowMapper paymentFlowMapper, RefundOrderMapper refundMapper,
                        BizNoGenerator bizNoGenerator, AlipaySandboxClient alipayClient,
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
        this.alipayClient = alipayClient;
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
        LocalDateTime now = LocalDateTime.now();
        int updated = orderMapper.update(null, new LambdaUpdateWrapper<BizOrder>()
                .eq(BizOrder::getId, order.getId())
                .eq(BizOrder::getStatus, "pending_pay")
                .eq(BizOrder::getVersion, order.getVersion())
                .set(BizOrder::getStatus, "cancelled")
                .set(BizOrder::getCancelledAt, now)
                .setSql("version = version + 1"));
        if (updated == 0) {
            throw new BusinessException(409, "订单已被处理，不可取消");
        }
    }

    @Transactional
    public PayVO pay(Long userId, String orderNo, PayRequest request) {
        BizOrder order = findUserOrder(userId, orderNo);
        expire(order);
        if (!"pending_pay".equals(order.getStatus())) {
            if ("opened".equals(order.getStatus())) throw new BusinessException(409, "订单已完成支付");
            throw new BusinessException(409, "当前订单不可支付");
        }
        if (mockEnabled) {
            markPaid(order, "mock", "MOCK-" + orderNo, "MOCK-NOTIFY-" + orderNo, null);
            openBox(order);
            PayVO vo = new PayVO();
            vo.setPayUrl("mock://tuge/pay/" + orderNo);
            vo.setQrCodeUrl("");
            vo.setMock(true);
            vo.setStatus(order.getStatus());
            return vo;
        }
        if (!alipayClient.isConfigured()) {
            throw new BusinessException(503, "支付宝沙箱尚未配置，请先配置支付密钥或临时开启 mock");
        }
        // 拉起即落一条 pending 流水，notify 成功后补全结果与渠道单号
        insertPendingFlow(order, "alipay");
        String payUrl = alipayClient.buildPagePayUrl(orderNo, order.getPriceCent(), order.getBoxName());
        PayVO vo = new PayVO();
        vo.setPayUrl(payUrl);
        vo.setQrCodeUrl("");
        vo.setQrCodeBase64(alipayClient.qrCodeBase64(payUrl));
        vo.setMock(false);
        vo.setStatus(order.getStatus());
        return vo;
    }

    @Transactional
    public RefundOrder requestRefund(Long userId, String orderNo, RefundRequest request) {
        BizOrder order = findUserOrder(userId, orderNo);
        if (!"opened".equals(order.getStatus())) {
            throw new BusinessException(409, "仅已开盒订单可申请退换");
        }
        Trip trip = order.getTripId() == null ? null : tripMapper.selectById(order.getTripId());
        if (trip == null || !"valid".equals(trip.getValidity())) {
            throw new BusinessException(409, "行程已失效，不可申请退换");
        }
        if ("value_guard".equals(request.kind())
                && trip.getValueCent() >= order.getPriceCent() * 12 / 10) {
            // 抽奖已保证保底（≥ 售价 1.2 倍），value_guard 仅作兜底
            throw new BusinessException(409, "票面价值已达标，不符合保底兜底条件");
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

    /**
     * notify 入账：乐观锁改 paid → 补流水 → 同一事务开盒。
     * 幂等：opened/refunded/cancelled 直接返回；已 paid 且已有 trip 返回；
     * 已 paid 无 trip（开盒中断）补流水后重入开盒（notify 重推/补单恢复路径）。
     */
    @Transactional
    public void creditAndOpen(BizOrder order, String channelTradeNo, String notifyId, String rawNotify) {
        if (List.of("opened", "refunded", "cancelled").contains(order.getStatus())) return;
        if ("paid".equals(order.getStatus())) {
            if (order.getTripId() != null) return;
            recordFlowResult(order, "alipay", "success", channelTradeNo, notifyId, rawNotify);
            openBox(order);
            return;
        }
        markPaid(order, "alipay", channelTradeNo, notifyId, rawNotify);
        openBox(order);
    }

    /** 记录非成功通知（closed/fail）的流水结果，订单保持 pending_pay。 */
    @Transactional
    public void recordClosedFlow(BizOrder order, String result, String channelTradeNo, String notifyId, String rawNotify) {
        recordFlowResult(order, "alipay", result, channelTradeNo, notifyId, rawNotify);
    }

    /** 乐观锁入账：仅 pending_pay 可改 paid；并发重复通知由调用方按 409 幂等处理。 */
    @Transactional
    public void markPaid(BizOrder order, String channel, String channelTradeNo, String notifyId, String rawNotify) {
        LocalDateTime now = LocalDateTime.now();
        int rows = orderMapper.update(null, new LambdaUpdateWrapper<BizOrder>()
                .eq(BizOrder::getId, order.getId())
                .eq(BizOrder::getStatus, "pending_pay")
                .eq(BizOrder::getVersion, order.getVersion())
                .set(BizOrder::getStatus, "paid")
                .set(BizOrder::getPaidCent, order.getPriceCent())
                .set(BizOrder::getPayChannel, channel)
                .set(BizOrder::getPaidAt, now)
                .setSql("version = version + 1"));
        if (rows == 0) throw new BusinessException(409, "订单已被并发处理");
        order.setStatus("paid");
        order.setPaidCent(order.getPriceCent());
        order.setPayChannel(channel);
        order.setPaidAt(now);
        recordFlowResult(order, channel, "success", channelTradeNo, notifyId, rawNotify);
    }

    /** 拉起支付时落 pending 流水，notify 到达后补全结果。 */
    private void insertPendingFlow(BizOrder order, String channel) {
        PaymentFlow flow = new PaymentFlow();
        flow.setFlowNo(bizNoGenerator.generate("F"));
        flow.setOrderId(order.getId());
        flow.setOrderNo(order.getOrderNo());
        flow.setChannel(channel);
        flow.setAmountCent(order.getPriceCent());
        flow.setResult("pending");
        paymentFlowMapper.insert(flow);
    }

    /**
     * 补全/追加流水结果。优先补全该订单该渠道最近一条 pending；
     * 无 pending 则新插入。notify_id 唯一索引兜底重复通知。
     */
    private void recordFlowResult(BizOrder order, String channel, String result,
                                  String channelTradeNo, String notifyId, String rawNotify) {
        try {
            PaymentFlow pending = paymentFlowMapper.selectOne(new LambdaQueryWrapper<PaymentFlow>()
                    .eq(PaymentFlow::getOrderId, order.getId())
                    .eq(PaymentFlow::getChannel, channel)
                    .eq(PaymentFlow::getResult, "pending")
                    .orderByDesc(PaymentFlow::getId)
                    .last("LIMIT 1"));
            if (pending != null) {
                pending.setResult(result);
                pending.setChannelTradeNo(channelTradeNo);
                pending.setNotifyId(notifyId);
                pending.setRawNotify(rawNotify);
                paymentFlowMapper.updateById(pending);
            } else {
                PaymentFlow flow = new PaymentFlow();
                flow.setFlowNo(bizNoGenerator.generate("F"));
                flow.setOrderId(order.getId());
                flow.setOrderNo(order.getOrderNo());
                flow.setChannel(channel);
                flow.setChannelTradeNo(channelTradeNo);
                flow.setAmountCent(order.getPriceCent());
                flow.setResult(result);
                flow.setNotifyId(notifyId);
                flow.setRawNotify(rawNotify);
                paymentFlowMapper.insert(flow);
            }
        } catch (DuplicateKeyException e) {
            throw new DuplicateNotifyException();
        }
    }

    @Transactional
    public void openBox(BizOrder order) {
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
        trip.setGuideSnapshotJson(route.getGuideJson());
        trip.setGuideVersion(route.getGuideVersion() == null ? 1 : route.getGuideVersion());
        trip.setMoodText(route.getMoodText());
        trip.setBadgeName(badge == null ? "旅行足迹" : badge.getName());
        trip.setValidity("valid");
        trip.setOpenedDate(LocalDate.now());
        try {
            tripMapper.insert(trip);
        } catch (DuplicateKeyException e) {
            // 并发重入时复用已存在的行程，继续补齐订单，而不是吞掉冲突。
            Trip existing = tripMapper.selectOne(new LambdaQueryWrapper<Trip>()
                    .eq(Trip::getOrderId, order.getId()).last("LIMIT 1"));
            if (existing != null) {
                attachExistingTrip(order, existing);
            }
            return;
        }

        attachNewTrip(order, trip, badge, route);
    }

    private void attachNewTrip(BizOrder order, Trip trip, Badge badge, TravelRoute route) {
        order.setStatus("opened");
        order.setOpenedAt(LocalDateTime.now());
        order.setRouteId(route.getId());
        order.setTripId(trip.getId());
        orderMapper.updateById(order);
        boxMapper.update(null, new LambdaUpdateWrapper<BlindBox>()
                .eq(BlindBox::getId, order.getBoxId()).setSql("open_count = open_count + 1"));
        routeMapper.update(null, new LambdaUpdateWrapper<TravelRoute>()
                .eq(TravelRoute::getId, route.getId()).setSql("draw_count = draw_count + 1"));
        ensureBadge(order, trip, badge);
    }

    private void attachExistingTrip(BizOrder order, Trip trip) {
        order.setStatus("opened");
        order.setOpenedAt(order.getOpenedAt() == null ? LocalDateTime.now() : order.getOpenedAt());
        order.setRouteId(trip.getRouteId());
        order.setTripId(trip.getId());
        orderMapper.updateById(order);
        ensureBadge(order, trip);
    }

    private void ensureBadge(BizOrder order, Trip trip, Badge badge) {
        if (badge == null) return;
        if (userBadgeMapper.selectOne(new LambdaQueryWrapper<UserBadge>()
                .eq(UserBadge::getUserId, order.getUserId()).eq(UserBadge::getBadgeId, badge.getId())) != null) return;
        UserBadge userBadge = new UserBadge();
        userBadge.setUserId(order.getUserId());
        userBadge.setBadgeId(badge.getId());
        userBadge.setSourceTripId(trip.getId());
        try {
            userBadgeMapper.insert(userBadge);
        } catch (DuplicateKeyException ignored) {
            // 并发开盒时另一事务已完成徽章解锁。
        }
    }

    private void ensureBadge(BizOrder order, Trip trip) {
        Badge badge = badgeMapper.selectOne(new LambdaQueryWrapper<Badge>()
                .eq(Badge::getName, trip.getBadgeName()).last("LIMIT 1"));
        ensureBadge(order, trip, badge);
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
        if ("alipay".equals(order.getPayChannel())) {
            // 抽奖失败自动全额退款：真实渠道必须原路退回，失败则整体回滚等待 notify 重推
            refund.setChannelRefundNo(alipayClient.refund(order.getOrderNo(), refund.getRefundNo(), refund.getAmountCent()));
        } else {
            refund.setChannelRefundNo("MOCK-REFUND-" + order.getOrderNo());
        }
        refundMapper.insert(refund);
        order.setStatus("refunded");
        orderMapper.updateById(order);
    }

    private void expire(BizOrder order) {
        if ("pending_pay".equals(order.getStatus()) && order.getExpireAt() != null
                && order.getExpireAt().isBefore(LocalDateTime.now())) {
            LocalDateTime now = LocalDateTime.now();
            int updated = orderMapper.update(null, new LambdaUpdateWrapper<BizOrder>()
                    .eq(BizOrder::getId, order.getId())
                    .eq(BizOrder::getStatus, "pending_pay")
                    .eq(BizOrder::getVersion, order.getVersion())
                    .set(BizOrder::getStatus, "cancelled")
                    .set(BizOrder::getCancelledAt, now)
                    .setSql("version = version + 1"));
            if (updated > 0) {
                order.setStatus("cancelled");
                order.setCancelledAt(now);
            }
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
        if (refund != null) {
            vo.setRefundNo(refund.getRefundNo());
            vo.setRefundStatus(refund.getStatus());
            vo.setRefundKind(refund.getKind());
            vo.setRefundRejectReason(refund.getRejectReason());
        }
        return vo;
    }

    private int safePage(long page) { return (int) Math.max(1, page); }

    private int safePageSize(long pageSize) { return (int) Math.min(100, Math.max(1, pageSize)); }
}
