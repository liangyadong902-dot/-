package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.tuge.domain.entity.Badge;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.MoodLog;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.entity.UserBadge;
import com.tuge.domain.mapper.BadgeMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.MoodLogMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.vo.UserStatsVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserStatsServiceTest {

    private TripMapper tripMapper;
    private BizOrderMapper orderMapper;
    private BadgeMapper badgeMapper;
    private UserBadgeMapper userBadgeMapper;
    private MoodLogMapper moodLogMapper;
    private UserStatsService service;

    @BeforeEach
    void setUp() {
        initTable(Trip.class);
        initTable(BizOrder.class);
        initTable(Badge.class);
        initTable(UserBadge.class);
        initTable(MoodLog.class);
        tripMapper = mock(TripMapper.class);
        orderMapper = mock(BizOrderMapper.class);
        badgeMapper = mock(BadgeMapper.class);
        userBadgeMapper = mock(UserBadgeMapper.class);
        moodLogMapper = mock(MoodLogMapper.class);
        service = new UserStatsService(tripMapper, orderMapper, badgeMapper, userBadgeMapper, moodLogMapper,
                mock(AppUserMapper.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void countsOnlyValidTripsButKeepsUnlockedBadges() {
        Trip trip = new Trip();
        trip.setUserId(7L);
        trip.setValidity("valid");
        trip.setPriceCent(9900);
        trip.setValueCent(14800);
        trip.setLocation("吉安");
        trip.setBoxCategory("nearby");
        trip.setOpenedDate(LocalDate.now());
        when(tripMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(trip));

        BizOrder order = new BizOrder();
        order.setUserId(7L);
        order.setStatus("opened");
        order.setPaidCent(9900);
        when(orderMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(order));
        when(userBadgeMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);
        when(badgeMapper.selectCount(null)).thenReturn(12L);
        when(moodLogMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        UserStatsVO result = service.get(7L);

        assertThat(result.getTripCount()).isEqualTo(1);
        assertThat(result.getSavedTotal()).isEqualByComparingTo("49.00");
        assertThat(result.getLevelNo()).isEqualTo(1);
        assertThat(result.getTitle()).isEqualTo("旅行新手");
        assertThat(result.getWelfareKm()).isEqualByComparingTo("1.00");
        assertThat(result.getBadgeUnlocked()).isEqualTo(2);
        assertThat(result.getBadgeTotal()).isEqualTo(12);
        assertThat(result.getDestinations()).containsExactly("吉安");
        assertThat(result.getDestinationCount()).isEqualTo(1);
        assertThat(result.getSpendTotal()).isEqualByComparingTo("99.00");

        ArgumentCaptor<LambdaQueryWrapper<Trip>> tripQuery = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(tripMapper).selectList(tripQuery.capture());
        tripQuery.getValue().getSqlSegment();
        assertThat(tripQuery.getValue().getParamNameValuePairs().values()).contains(7L, "valid");
    }

    private static void initTable(Class<?> entityType) {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityType);
    }
}
