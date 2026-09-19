package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.auth.AdminRoles;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AdminTransactionService {
    private final BizOrderMapper orderMapper;
    private final RefundOrderMapper refundMapper;
    private final AppUserMapper userMapper;
    private final TravelRouteMapper routeMapper;
    private final TripMapper tripMapper;
    private final PaymentFlowMapper paymentFlowMapper;

    public AdminTransactionService(BizOrderMapper orderMapper, RefundOrderMapper refundMapper,
                                   AppUserMapper userMapper, TravelRouteMapper routeMapper,
                                   TripMapper tripMapper, PaymentFlowMapper paymentFlowMapper) {
        this.orderMapper = orderMapper;
        this.refundMapper = refundMapper;
        this.userMapper = userMapper;
        this.routeMapper = routeMapper;
        this.tripMapper = tripMapper;
        this.paymentFlowMapper = paymentFlowMapper;
    }

    public PageResult<AdminOrderVO> listOrders(String orderNo, Long userId, String status, long page, long pageSize) {
        Page<BizOrder> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<BizOrder> rows = orderMapper.selectPage(result, new LambdaQueryWrapper<BizOrder>()
                .like(orderNo != null && !orderNo.isBlank(), BizOrder::getOrderNo, orderNo)
                .eq(userId != null, BizOrder::getUserId, userId)
                .eq(status != null && !status.isBlank(), BizOrder::getStatus, status)
                .orderByDesc(BizOrder::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(this::toOrder).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public AdminOrderVO order(String orderNo) {
        BizOrder row = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getOrderNo, orderNo));
        if (row == null) throw new BusinessException(404, "订单不存在");
        return toOrder(row);
    }

    public PageResult<AdminRefundVO> listRefunds(String status, long page, long pageSize) {
        Page<RefundOrder> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<RefundOrder> rows = refundMapper.selectPage(result, new LambdaQueryWrapper<RefundOrder>()
                .eq(status != null && !status.isBlank(), RefundOrder::getStatus, status)
                .orderByDesc(RefundOrder::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(this::toRefund).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public PageResult<AdminPaymentFlowVO> listPaymentFlows(String orderNo, String channel, long page, long pageSize) {
        Page<PaymentFlow> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<PaymentFlow> rows = paymentFlowMapper.selectPage(result, new LambdaQueryWrapper<PaymentFlow>()
                .eq(orderNo != null && !orderNo.isBlank(), PaymentFlow::getOrderNo, orderNo)
                .eq(channel != null && !channel.isBlank(), PaymentFlow::getChannel, channel)
                .orderByDesc(PaymentFlow::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(row -> {
            AdminPaymentFlowVO vo = new AdminPaymentFlowVO();
            vo.setFlowNo(row.getFlowNo()); vo.setOrderNo(row.getOrderNo()); vo.setChannel(row.getChannel());
            vo.setChannelTradeNo(row.getChannelTradeNo()); vo.setAmountCent(row.getAmountCent());
            vo.setResult(row.getResult()); vo.setCreatedAt(row.getCreatedAt());
            return vo;
        }).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public void approve(String refundNo) {
        requireRefundWrite();
        RefundOrder refund = findRefund(refundNo);
        if (!"pending_review".equals(refund.getStatus())) throw new BusinessException(409, "退款单当前不可审核");
        refund.setStatus("approved");
        refund.setReviewerId(JwtContext.getUserId());
        refund.setReviewedAt(LocalDateTime.now());
        refundMapper.updateById(refund);
        BizOrder order = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getId, refund.getOrderId()));
        if (order != null) {
            order.setStatus("refunded");
            orderMapper.updateById(order);
            Trip trip = tripMapper.selectOne(new LambdaQueryWrapper<Trip>().eq(Trip::getOrderId, order.getId()));
            if (trip != null) {
                trip.setValidity("invalid");
                tripMapper.updateById(trip);
            }
        }
    }

    @Transactional
    public void reject(String refundNo, String reason) {
        requireRefundWrite();
        RefundOrder refund = findRefund(refundNo);
        if (!"pending_review".equals(refund.getStatus())) throw new BusinessException(409, "退款单当前不可审核");
        refund.setStatus("rejected");
        refund.setRejectReason(reason == null || reason.isBlank() ? "审核未通过" : reason.trim());
        refund.setReviewerId(JwtContext.getUserId());
        refund.setReviewedAt(LocalDateTime.now());
        refundMapper.updateById(refund);
    }

    private void requireRefundWrite() {
        String role = JwtContext.getRole();
        if (!"super_admin".equals(role) && !"finance".equals(role)) {
            throw new BusinessException(403, "当前角色无退款审核权限");
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

    private int safePage(long page) { return (int) Math.max(1, page); }
    private int safePageSize(long size) { return (int) Math.min(100, Math.max(1, size)); }
}
