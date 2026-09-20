package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.tuge.common.biz.BizNoGenerator;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.CreateOrderRequest;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.mapper.BadgeMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.PaymentFlowMapper;
import com.tuge.domain.mapper.RefundOrderMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.vo.OrderVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.apache.ibatis.builder.MapperBuilderAssistant;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderServicePrePaymentTest {

    private BizOrderMapper orderMapper;
    private BlindBoxMapper boxMapper;
    private TripMapper tripMapper;
    private BizNoGenerator bizNoGenerator;
    private OrderService service;

    @BeforeEach
    void setUp() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), BizOrder.class);
        orderMapper = mock(BizOrderMapper.class);
        boxMapper = mock(BlindBoxMapper.class);
        tripMapper = mock(TripMapper.class);
        bizNoGenerator = mock(BizNoGenerator.class);
        service = new OrderService(
                orderMapper,
                boxMapper,
                mock(TravelRouteMapper.class),
                tripMapper,
                mock(BadgeMapper.class),
                mock(UserBadgeMapper.class),
                mock(PaymentFlowMapper.class),
                mock(RefundOrderMapper.class),
                bizNoGenerator,
                mock(AlipaySandboxClient.class),
                false);
    }

    @Test
    @SuppressWarnings("unchecked")
    void createsSnapshotWithoutCreatingTrip() {
        BlindBox box = box("on");
        when(boxMapper.selectById(1L)).thenReturn(box);
        when(orderMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(bizNoGenerator.generate("T")).thenReturn("T20260920001");

        OrderVO result = service.create(10L, new CreateOrderRequest(1L));
        box.setName("已改名盲盒");
        box.setPriceCent(19900);

        assertThat(result.getOrderNo()).isEqualTo("T20260920001");
        assertThat(result.getBoxName()).isEqualTo("周边微度假盲盒");
        assertThat(result.getPriceCent()).isEqualTo(9900);
        assertThat(result.getStatus()).isEqualTo("pending_pay");
        verify(tripMapper, never()).insert(any());
    }

    @Test
    void rejectsOffShelfBox() {
        when(boxMapper.selectById(1L)).thenReturn(box("off"));

        assertThatThrownBy(() -> service.create(10L, new CreateOrderRequest(1L)))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(404);
    }

    @Test
    @SuppressWarnings("unchecked")
    void rejectsDuplicateActiveOrder() {
        when(boxMapper.selectById(1L)).thenReturn(box("on"));
        BizOrder active = order(10L, "pending_pay");
        when(orderMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(active);

        assertThatThrownBy(() -> service.create(10L, new CreateOrderRequest(1L)))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(409);
    }

    @Test
    @SuppressWarnings("unchecked")
    void scopesOrderLookupToUserAndOrderNumber() {
        BizOrder order = order(11L, "pending_pay");
        order.setOrderNo("T-OWNED");
        when(orderMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(order);

        service.findUserOrder(11L, "T-OWNED");

        ArgumentCaptor<LambdaQueryWrapper<BizOrder>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(orderMapper).selectOne(captor.capture());
        captor.getValue().getSqlSegment();
        assertThat(captor.getValue().getParamNameValuePairs().values())
                .contains(11L, "T-OWNED");
    }

    @Test
    @SuppressWarnings("unchecked")
    void hidesAnotherUsersOrderAsNotFound() {
        when(orderMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        assertThatThrownBy(() -> service.detail(20L, "T-USER-10"))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(404);

        verify(orderMapper).selectOne(any(LambdaQueryWrapper.class));
        verify(orderMapper, never()).updateById(any());
        verify(tripMapper, never()).insert(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void expiresPendingOrderWithoutCreatingTrip() {
        BizOrder expired = order(10L, "pending_pay");
        expired.setOrderNo("T-EXPIRED");
        expired.setExpireAt(LocalDateTime.now().minusMinutes(1));
        when(orderMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(expired);
        when(orderMapper.update(isNull(), any())).thenReturn(1);

        OrderVO result = service.detail(10L, "T-EXPIRED");

        assertThat(result.getStatus()).isEqualTo("cancelled");
        verify(orderMapper).update(isNull(), any());
        verify(tripMapper, never()).insert(any());
    }

    private BlindBox box(String status) {
        BlindBox box = new BlindBox();
        box.setId(1L);
        box.setName("周边微度假盲盒");
        box.setCategory("nearby");
        box.setPriceCent(9900);
        box.setMinValueCent(12000);
        box.setStatus(status);
        return box;
    }

    private BizOrder order(long userId, String status) {
        BizOrder order = new BizOrder();
        order.setId(1L);
        order.setUserId(userId);
        order.setBoxId(1L);
        order.setBoxName("周边微度假盲盒");
        order.setBoxCategory("nearby");
        order.setPriceCent(9900);
        order.setPaidCent(0);
        order.setMinValueCent(12000);
        order.setStatus(status);
        order.setVersion(0);
        return order;
    }
}
