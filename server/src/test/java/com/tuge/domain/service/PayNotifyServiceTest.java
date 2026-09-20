package com.tuge.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.PaymentFlowMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PayNotifyServiceTest {

    private BizOrderMapper orders;
    private PaymentFlowMapper flows;
    private AlipaySandboxClient alipay;
    private OrderService orderService;
    private PayNotifyService service;

    @BeforeEach
    void setUp() {
        orders = mock(BizOrderMapper.class);
        flows = mock(PaymentFlowMapper.class);
        alipay = mock(AlipaySandboxClient.class);
        orderService = mock(OrderService.class);
        service = new PayNotifyService(orders, flows, alipay, orderService, new ObjectMapper());
    }

    @Test
    void rejectsUnverifiedNotification() {
        when(alipay.isConfigured()).thenReturn(true);
        when(alipay.verifyNotify(any())).thenReturn(false);

        assertThat(service.handleNotify(params("99.00"))).isEqualTo("failure");
        verify(orders, never()).selectOne(any());
        verify(orderService, never()).creditAndOpen(any(), any(), any(), any());
    }

    @Test
    void duplicateNotifyIdReturnsSuccessWithoutOpeningAgain() {
        acceptSignature();
        when(orders.selectOne(any())).thenReturn(order());
        when(flows.selectCount(any())).thenReturn(1L);

        assertThat(service.handleNotify(params("99.00"))).isEqualTo("success");
        verify(orderService, never()).creditAndOpen(any(), any(), any(), any());
    }

    @Test
    void validNotificationCreditsAndOpensExactlyOnce() {
        acceptSignature();
        BizOrder order = order();
        when(orders.selectOne(any())).thenReturn(order);
        when(flows.selectCount(any())).thenReturn(0L);

        assertThat(service.handleNotify(params("99.00"))).isEqualTo("success");
        verify(orderService).creditAndOpen(eq(order), eq("trade-1"), eq("notify-1"), any());
    }

    @Test
    void mismatchedAmountRecordsFailureAndDoesNotOpen() {
        acceptSignature();
        BizOrder order = order();
        when(orders.selectOne(any())).thenReturn(order);
        when(flows.selectCount(any())).thenReturn(0L);

        assertThat(service.handleNotify(params("98.00"))).isEqualTo("success");
        verify(orderService).recordClosedFlow(eq(order), eq("fail"), eq("trade-1"), eq("notify-1"), any());
        verify(orderService, never()).creditAndOpen(any(), any(), any(), any());
    }

    private void acceptSignature() {
        when(alipay.isConfigured()).thenReturn(true);
        when(alipay.verifyNotify(any())).thenReturn(true);
    }

    private BizOrder order() {
        BizOrder order = new BizOrder();
        order.setId(1L);
        order.setOrderNo("T1");
        order.setPriceCent(9900);
        order.setStatus("pending_pay");
        return order;
    }

    private Map<String, String> params(String amount) {
        Map<String, String> params = new HashMap<>();
        params.put("out_trade_no", "T1");
        params.put("trade_no", "trade-1");
        params.put("notify_id", "notify-1");
        params.put("trade_status", "TRADE_SUCCESS");
        params.put("total_amount", amount);
        params.put("sign", "test-signature");
        return params;
    }
}
