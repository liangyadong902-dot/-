package com.tuge.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.PaymentFlow;
import com.tuge.domain.entity.RefundOrder;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.PaymentFlowMapper;
import com.tuge.domain.mapper.RefundOrderMapper;
import com.tuge.domain.mapper.TripMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class UserFinanceController {
    private final BizOrderMapper orderMapper;
    private final PaymentFlowMapper paymentMapper;
    private final RefundOrderMapper refundMapper;
    private final TripMapper tripMapper;

    public UserFinanceController(BizOrderMapper orderMapper, PaymentFlowMapper paymentMapper,
                                 RefundOrderMapper refundMapper, TripMapper tripMapper) {
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.refundMapper = refundMapper;
        this.tripMapper = tripMapper;
    }

    @GetMapping("/me/payment-records")
    public Result<PageResult<Map<String, Object>>> paymentRecords(@RequestParam(defaultValue = "1") long page,
                                                                    @RequestParam(defaultValue = "20") long pageSize) {
        Long userId = requireUser();
        List<BizOrder> orders = orderMapper.selectList(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getUserId, userId));
        Map<Long, BizOrder> byId = new LinkedHashMap<>();
        orders.forEach(order -> byId.put(order.getId(), order));
        if (byId.isEmpty()) return Result.success(PageResult.of(List.of(), 0, Math.max(1, page), Math.min(100, Math.max(1, pageSize))));
        List<PaymentFlow> flows = paymentMapper.selectList(new LambdaQueryWrapper<PaymentFlow>().in(PaymentFlow::getOrderId, byId.keySet()).orderByDesc(PaymentFlow::getCreatedAt));
        List<Map<String, Object>> list = new ArrayList<>();
        for (PaymentFlow flow : flows) {
            BizOrder order = byId.get(flow.getOrderId());
            if (order == null) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("paymentNo", flow.getFlowNo()); item.put("orderNo", flow.getOrderNo()); item.put("boxName", order.getBoxName());
            item.put("channel", flow.getChannel()); item.put("amountCent", flow.getAmountCent()); item.put("amount", yuan(flow.getAmountCent()));
            item.put("result", flow.getResult()); item.put("channelTradeNo", flow.getChannelTradeNo()); item.put("createdAt", flow.getCreatedAt()); item.put("paidAt", order.getPaidAt());
            list.add(item);
        }
        return Result.success(page(list, page, pageSize));
    }

    @GetMapping("/refunds")
    public Result<PageResult<Map<String, Object>>> refunds(@RequestParam(defaultValue = "1") long page,
                                                            @RequestParam(defaultValue = "20") long pageSize,
                                                            @RequestParam(required = false) String status) {
        Long userId = requireUser();
        List<RefundOrder> rows = refundMapper.selectList(new LambdaQueryWrapper<RefundOrder>().eq(RefundOrder::getUserId, userId).eq(status != null && !status.isBlank(), RefundOrder::getStatus, status).orderByDesc(RefundOrder::getCreatedAt));
        return Result.success(page(rows.stream().map(this::refundMap).toList(), page, pageSize));
    }

    @GetMapping("/refunds/{refundNo}")
    public Result<Map<String, Object>> refund(@PathVariable String refundNo) {
        Long userId = requireUser();
        RefundOrder refund = refundMapper.selectOne(new LambdaQueryWrapper<RefundOrder>().eq(RefundOrder::getRefundNo, refundNo).eq(RefundOrder::getUserId, userId));
        if (refund == null) throw new BusinessException(404, "退款单不存在");
        return Result.success(refundMap(refund));
    }

    @GetMapping("/orders/{orderNo}/refund-eligibility")
    public Result<Map<String, Object>> eligibility(@PathVariable String orderNo) {
        Long userId = requireUser();
        BizOrder order = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getUserId, userId).eq(BizOrder::getOrderNo, orderNo));
        if (order == null) throw new BusinessException(404, "订单不存在");
        Trip trip = order.getTripId() == null ? null : tripMapper.selectById(order.getTripId());
        boolean eligible = "opened".equals(order.getStatus()) && trip != null && "valid".equals(trip.getValidity());
        Map<String, Object> result = new LinkedHashMap<>(); result.put("eligible", eligible); result.put("maxAmount", yuan(order.getPaidCent()));
        result.put("allowedKinds", List.of("unused", "value_guard")); result.put("reasonCode", eligible ? null : "ORDER_NOT_ELIGIBLE"); result.put("reasonMessage", eligible ? null : "仅有效的已开盒订单可申请退款");
        return Result.success(result);
    }

    private Map<String, Object> refundMap(RefundOrder refund) {
        BizOrder order = orderMapper.selectById(refund.getOrderId());
        Map<String, Object> item = new LinkedHashMap<>(); item.put("refundNo", refund.getRefundNo()); item.put("orderNo", refund.getOrderNo()); item.put("boxName", order == null ? null : order.getBoxName()); item.put("amountCent", refund.getAmountCent()); item.put("amount", yuan(refund.getAmountCent())); item.put("kind", refund.getKind()); item.put("status", refund.getStatus()); item.put("reason", refund.getReason()); item.put("rejectReason", refund.getRejectReason()); item.put("createdAt", refund.getCreatedAt()); item.put("reviewedAt", refund.getReviewedAt()); item.put("payChannel", order == null ? null : order.getPayChannel()); item.put("orderStatus", order == null ? null : order.getStatus()); item.put("tripId", order == null ? null : order.getTripId());
        return item;
    }

    private Long requireUser() { Long userId = JwtContext.getUserId(); if (userId == null) throw new BusinessException(401, "请先登录"); return userId; }
    private BigDecimal yuan(Integer cents) { return BigDecimal.valueOf(cents == null ? 0 : cents).movePointLeft(2).setScale(2, RoundingMode.HALF_UP); }
    private <T> PageResult<T> page(List<T> rows, long page, long pageSize) { int p = (int) Math.max(1, page); int size = (int) Math.min(100, Math.max(1, pageSize)); int from = Math.min(rows.size(), (p - 1) * size); int to = Math.min(rows.size(), from + size); return PageResult.of(rows.subList(from, to), rows.size(), p, size); }
}
