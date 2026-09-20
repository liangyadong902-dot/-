package com.tuge.domain.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.PaymentFlowMapper;
import com.tuge.domain.mapper.RefundOrderMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.mapper.TripMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminTransactionServiceRoleTest {

    private BizOrderMapper orderMapper;
    private RefundOrderMapper refundMapper;
    private OrderService orderService;
    private AdminTransactionService service;

    @BeforeEach
    void setUp() {
        orderMapper = mock(BizOrderMapper.class);
        refundMapper = mock(RefundOrderMapper.class);
        orderService = mock(OrderService.class);
        service = new AdminTransactionService(
                orderMapper,
                refundMapper,
                mock(AppUserMapper.class),
                mock(TravelRouteMapper.class),
                mock(TripMapper.class),
                mock(PaymentFlowMapper.class),
                mock(AlipaySandboxClient.class),
                orderService);
    }

    @AfterEach
    void clearContext() {
        JwtContext.clear();
    }

    @Test
    void operatorCannotApproveRefund() {
        JwtContext.set(1L, "operator");

        assertThatThrownBy(() -> service.approve("R-1"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(403);

        verify(refundMapper, never()).selectOne(any());
    }

    @Test
    void customerServiceCanReopenPaidOrder() {
        JwtContext.set(2L, "cs");
        BizOrder order = new BizOrder();
        order.setId(9L);
        order.setOrderNo("T-9");
        order.setStatus("paid");
        order.setUserId(20L);
        order.setPaidCent(9900);
        when(orderMapper.selectOne(any())).thenReturn(order);
        when(orderMapper.selectById(9L)).thenReturn(order);

        assertThatCode(() -> service.reopen("T-9")).doesNotThrowAnyException();

        verify(orderService).openBox(order);
    }

    @Test
    @SuppressWarnings("unchecked")
    void analystCanReadAndExportOrders() {
        JwtContext.set(3L, "analyst");
        when(orderMapper.selectPage(any(Page.class), any())).thenAnswer(invocation -> {
            Page<BizOrder> page = invocation.getArgument(0);
            page.setRecords(List.of());
            page.setTotal(0);
            return page;
        });

        assertThatCode(() -> service.listOrders(null, null, null, null, null, null, null, 1, 20))
                .doesNotThrowAnyException();
        assertThatCode(() -> service.exportOrders(null, null, null, null, null, null, null))
                .doesNotThrowAnyException();
    }

    @Test
    void operatorCannotExportOrders() {
        JwtContext.set(4L, "operator");

        assertThatThrownBy(() -> service.exportOrders(null, null, null, null, null, null, null))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(403);
    }
}
