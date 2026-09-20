package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.exception.DuplicateNotifyException;
import com.tuge.common.util.Money;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.PaymentFlow;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.PaymentFlowMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 支付宝异步通知入账。入账唯一依据：验签通过 + 金额一致 + notify_id 幂等。
 * 任何「不入账」的分支都不返回 failure 的语义由调用方决定，这里只返回应答文本。
 */
@Service
public class PayNotifyService {

    private static final Logger log = LoggerFactory.getLogger(PayNotifyService.class);

    private final BizOrderMapper orderMapper;
    private final PaymentFlowMapper paymentFlowMapper;
    private final AlipaySandboxClient alipayClient;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    public PayNotifyService(BizOrderMapper orderMapper, PaymentFlowMapper paymentFlowMapper,
                            AlipaySandboxClient alipayClient, OrderService orderService,
                            ObjectMapper objectMapper) {
        this.orderMapper = orderMapper;
        this.paymentFlowMapper = paymentFlowMapper;
        this.alipayClient = alipayClient;
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    /** 处理 notify，返回给支付宝的纯文本应答：success / failure。 */
    public String handleNotify(Map<String, String> params) {
        if (!alipayClient.isConfigured() || !alipayClient.verifyNotify(params)) {
            log.warn("[pay-notify] 验签失败，拒绝处理：orderNo={} notifyId={}",
                    params.get("out_trade_no"), params.get("notify_id"));
            return "failure";
        }
        String orderNo = params.get("out_trade_no");
        String tradeNo = params.get("trade_no");
        String notifyId = params.get("notify_id");
        String tradeStatus = params.get("trade_status");
        String totalAmount = params.get("total_amount");
        String rawNotify = toJson(params);

        BizOrder order = orderMapper.selectOne(new LambdaQueryWrapper<BizOrder>()
                .eq(BizOrder::getOrderNo, orderNo));
        if (order == null) {
            // 不存在的单：不入账；返回 success 避免支付宝无限重推
            log.warn("[pay-notify] 订单不存在，忽略：orderNo={}", orderNo);
            return "success";
        }
        // notify_id 幂等：已处理过的通知直接 success
        if (notifyId != null && paymentFlowMapper.selectCount(new LambdaQueryWrapper<PaymentFlow>()
                .eq(PaymentFlow::getNotifyId, notifyId)) > 0) {
            log.info("[pay-notify] 重复通知，幂等返回：notifyId={}", notifyId);
            return "success";
        }
        if (!List.of("TRADE_SUCCESS", "TRADE_FINISHED").contains(tradeStatus)) {
            // 非成功状态：可记 closed/fail 流水，订单保持 pending_pay
            if ("TRADE_CLOSED".equals(tradeStatus)) {
                orderService.recordClosedFlow(order, "closed", tradeNo, notifyId, rawNotify);
            }
            return "success";
        }
        int amountCent = Money.cent(totalAmount == null ? null : Double.parseDouble(totalAmount));
        if (amountCent != order.getPriceCent()) {
            log.warn("[pay-notify] 金额不一致，记流水 fail 不入账：orderNo={} expect={} actual={}",
                    orderNo, order.getPriceCent(), amountCent);
            orderService.recordClosedFlow(order, "fail", tradeNo, notifyId, rawNotify);
            return "success";
        }
        try {
            orderService.creditAndOpen(order, tradeNo, notifyId, rawNotify);
            return "success";
        } catch (DuplicateNotifyException e) {
            return "success";
        } catch (BusinessException e) {
            if (e.getCode() == 409) {
                // 并发通知已被另一条处理
                return "success";
            }
            log.error("[pay-notify] 入账失败，等待重推：orderNo={}", orderNo, e);
            return "failure";
        } catch (Exception e) {
            log.error("[pay-notify] 入账异常，等待重推：orderNo={}", orderNo, e);
            return "failure";
        }
    }

    private String toJson(Map<String, String> params) {
        try {
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            return String.valueOf(params);
        }
    }
}
