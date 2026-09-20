package com.tuge.domain.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.AdminUserVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminUserServiceTest {

    private AppUserMapper userMapper;
    private TripMapper tripMapper;
    private BizOrderMapper orderMapper;
    private AdminUserService service;

    @BeforeEach
    void setUp() {
        userMapper = mock(AppUserMapper.class);
        tripMapper = mock(TripMapper.class);
        orderMapper = mock(BizOrderMapper.class);
        service = new AdminUserService(userMapper, tripMapper, orderMapper, mock(AdminAccessService.class));
    }

    private AppUser user(long id, String nickname, String phone, String channel, String status) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setNickname(nickname);
        user.setPhone(phone);
        user.setRegisterChannel(channel);
        user.setStatus(status);
        user.setCreatedAt(LocalDateTime.of(2026, 9, 1, 10, 0));
        return user;
    }

    private Trip trip(long userId, int priceCent, int valueCent) {
        Trip trip = new Trip();
        trip.setUserId(userId);
        trip.setPriceCent(priceCent);
        trip.setValueCent(valueCent);
        trip.setValidity("valid");
        return trip;
    }

    private BizOrder order(long userId, int paidCent, String status) {
        BizOrder order = new BizOrder();
        order.setUserId(userId);
        order.setPaidCent(paidCent);
        order.setStatus(status);
        return order;
    }

    @SuppressWarnings("unchecked")
    private void stubUsers(List<AppUser> users, long total) {
        when(userMapper.selectPage(any(Page.class), any())).thenAnswer(invocation -> {
            Page<AppUser> page = invocation.getArgument(0);
            page.setRecords(users);
            page.setTotal(total);
            return page;
        });
    }

    @Test
    void mapsDatabaseStatusToApiStatus() {
        stubUsers(List.of(user(1, "小途", "13800001111", "phone", "normal"),
                user(2, "小喜", "13900002222", "phone", "disabled")), 2);
        when(tripMapper.selectList(any())).thenReturn(List.of());
        when(orderMapper.selectList(any())).thenReturn(List.of());

        PageResult<AdminUserVO> result = service.list(null, null, null, 1, 20);

        assertThat(result.getList()).hasSize(2);
        assertThat(result.getList().get(0).getStatus()).isEqualTo("active");
        assertThat(result.getList().get(1).getStatus()).isEqualTo("disabled");
    }

    @Test
    void masksPhoneAndExposesWechatNicknameOnlyForWechatChannel() {
        stubUsers(List.of(user(1, "微信途友", "13800001111", "wechat", "normal"),
                user(2, "手机途友", "13900002222", "phone", "normal")), 2);
        when(tripMapper.selectList(any())).thenReturn(List.of());
        when(orderMapper.selectList(any())).thenReturn(List.of());

        List<AdminUserVO> list = service.list(null, null, null, 1, 20).getList();

        assertThat(list.get(0).getPhone()).isEqualTo("138****1111");
        assertThat(list.get(0).getWechatNickname()).isEqualTo("微信途友");
        assertThat(list.get(1).getWechatNickname()).isNull();
    }

    @Test
    void aggregatesOnlyValidTripsAndCompletedOrders() {
        stubUsers(List.of(user(1, "小途", "13800001111", "phone", "normal")), 1);
        when(tripMapper.selectList(any())).thenReturn(List.of(trip(1, 9900, 14800), trip(1, 12900, 16000)));
        when(orderMapper.selectList(any())).thenReturn(List.of(order(1, 9900, "opened"), order(1, 12900, "paid")));

        AdminUserVO vo = service.list(null, null, null, 1, 20).getList().get(0);

        assertThat(vo.getTripCount()).isEqualTo(2);
        assertThat(vo.getSavedTotal()).isEqualByComparingTo("80.00");
        assertThat(vo.getSpendTotal()).isEqualByComparingTo("228.00");
        assertThat(vo.getTitle()).isEqualTo("旅行新手");
    }

    @Test
    void returnsZeroTotalsWhenUserHasNoTripsOrOrders() {
        stubUsers(List.of(user(1, "新用户", "13800001111", "phone", "normal")), 1);
        when(tripMapper.selectList(any())).thenReturn(List.of());
        when(orderMapper.selectList(any())).thenReturn(List.of());

        AdminUserVO vo = service.list(null, null, null, 1, 20).getList().get(0);

        assertThat(vo.getTripCount()).isZero();
        assertThat(vo.getSavedTotal()).isEqualByComparingTo("0.00");
        assertThat(vo.getSpendTotal()).isEqualByComparingTo("0.00");
        assertThat(vo.getTitle()).isEqualTo("旅行新手");
    }

    @Test
    void titleFollowsTripThresholds() {
        stubUsers(List.of(user(1, "探索者", "13800001111", "phone", "normal"),
                user(2, "旅行家", "13900002222", "phone", "normal")), 2);
        when(tripMapper.selectList(any())).thenReturn(List.of(
                trip(1, 0, 0), trip(1, 0, 0), trip(1, 0, 0),
                trip(2, 0, 0), trip(2, 0, 0), trip(2, 0, 0), trip(2, 0, 0),
                trip(2, 0, 0), trip(2, 0, 0), trip(2, 0, 0), trip(2, 0, 0)));
        when(orderMapper.selectList(any())).thenReturn(List.of());

        List<AdminUserVO> list = service.list(null, null, null, 1, 20).getList();

        assertThat(list.get(0).getTitle()).isEqualTo("探索者");
        assertThat(list.get(1).getTitle()).isEqualTo("旅行家");
    }

    @Test
    void emptyPageReturnsEmptyListWithoutExtraQueries() {
        stubUsers(List.of(), 0);

        PageResult<AdminUserVO> result = service.list(null, null, null, 1, 20);

        assertThat(result.getList()).isEmpty();
        assertThat(result.getTotal()).isZero();
    }

    @Test
    void clampsPageAndPageSizeBounds() {
        stubUsers(List.of(), 0);

        PageResult<AdminUserVO> result = service.list(null, null, null, 0, 1000);

        assertThat(result.getPage()).isEqualTo(1);
        assertThat(result.getPageSize()).isEqualTo(100);
    }

    @Test
    void unboundPhoneIsReportedAsNotBound() {
        stubUsers(List.of(user(1, "微信途友", null, "wechat", "normal")), 1);
        when(tripMapper.selectList(any())).thenReturn(List.of());
        when(orderMapper.selectList(any())).thenReturn(List.of());

        assertThat(service.list(null, null, null, 1, 20).getList().get(0).getPhone()).isEqualTo("未绑定");
    }
}
