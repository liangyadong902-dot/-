package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.ChatMessage;
import com.tuge.domain.entity.MoodLog;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.ChatMessageMapper;
import com.tuge.domain.mapper.MoodLogMapper;
import com.tuge.domain.mapper.RefundOrderMapper;
import com.tuge.domain.mapper.TripMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminStatsServiceTest {
    private AppUserMapper userMapper;
    private BizOrderMapper orderMapper;
    private TripMapper tripMapper;
    private MoodLogMapper moodMapper;
    private ChatMessageMapper messageMapper;
    private AdminStatsService service;

    @BeforeEach
    void setUp() {
        initTable(BizOrder.class); initTable(Trip.class); initTable(MoodLog.class); initTable(ChatMessage.class);
        userMapper = mock(AppUserMapper.class); orderMapper = mock(BizOrderMapper.class);
        tripMapper = mock(TripMapper.class); moodMapper = mock(MoodLogMapper.class);
        messageMapper = mock(ChatMessageMapper.class);
        service = new AdminStatsService(userMapper, orderMapper, mock(RefundOrderMapper.class), tripMapper,
                moodMapper, messageMapper, mock(AdminAccessService.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void calculatesTitlesFromValidTripsAndLoadsOrdersOnce() {
        when(userMapper.selectList(any())).thenReturn(List.of(user(1L), user(2L), user(3L)));
        when(moodMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        when(messageMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        BizOrder opened = new BizOrder(); opened.setStatus("opened");
        when(orderMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(opened));
        List<Trip> trips = new ArrayList<>();
        for (int i = 0; i < 3; i++) trips.add(trip(2L));
        for (int i = 0; i < 8; i++) trips.add(trip(3L));
        when(tripMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(trips);

        Map<String, Object> result = service.users(null, null);

        assertThat((Map<String, Long>) result.get("titleDistribution"))
                .containsEntry("旅行新手", 1L).containsEntry("探索者", 1L).containsEntry("旅行家", 1L);
        verify(orderMapper, times(1)).selectList(any(LambdaQueryWrapper.class));
    }

    private static AppUser user(Long id) { AppUser row = new AppUser(); row.setId(id); return row; }
    private static Trip trip(Long userId) { Trip row = new Trip(); row.setUserId(userId); row.setValidity("valid"); return row; }
    private static void initTable(Class<?> entityType) {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityType);
    }
}
