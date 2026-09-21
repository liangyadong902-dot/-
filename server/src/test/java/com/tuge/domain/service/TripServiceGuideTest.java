package com.tuge.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.entity.TravelRoute;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.mapper.TripMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TripServiceGuideTest {
    private final TripMapper tripMapper = mock(TripMapper.class);
    private final TravelRouteMapper routeMapper = mock(TravelRouteMapper.class);
    private final TripService service = new TripService(tripMapper, routeMapper, new ObjectMapper());

    @BeforeEach
    void initializeMybatisMetadata() {
        TableInfoHelper.initTableInfo(new org.apache.ibatis.builder.MapperBuilderAssistant(
                new MybatisConfiguration(), "trip-guide-test"), Trip.class);
    }

    @Test
    void usesPersistedTripSnapshotFirst() {
        Trip trip = trip("{\"durationText\":\"2天1夜\"}");
        when(tripMapper.selectOne(any())).thenReturn(trip);

        assertThat(service.guide(7L, 9L)).containsEntry("durationText", "2天1夜");
        verify(routeMapper, never()).selectById(any());
    }

    @Test
    void backfillsMissingSnapshotFromRoute() {
        Trip trip = trip(null);
        TravelRoute route = new TravelRoute();
        route.setGuideJson("{\"durationText\":\"3天2夜\"}");
        route.setGuideVersion(4);
        when(tripMapper.selectOne(any())).thenReturn(trip);
        when(routeMapper.selectById(3L)).thenReturn(route);

        assertThat(service.guide(7L, 9L)).containsEntry("durationText", "3天2夜");
        assertThat(trip.getGuideSnapshotJson()).isEqualTo(route.getGuideJson());
        assertThat(trip.getGuideVersion()).isEqualTo(4);
        verify(tripMapper).updateById(trip);
    }

    @Test
    void rejectsRouteWithoutDatabaseGuide() {
        Trip trip = trip(null);
        when(tripMapper.selectOne(any())).thenReturn(trip);
        when(routeMapper.selectById(3L)).thenReturn(new TravelRoute());

        assertThatThrownBy(() -> service.guide(7L, 9L))
                .isInstanceOf(BusinessException.class).extracting("code").isEqualTo(409);
    }

    private Trip trip(String guide) {
        Trip trip = new Trip();
        trip.setId(9L);
        trip.setUserId(7L);
        trip.setRouteId(3L);
        trip.setRouteName("真实路线");
        trip.setGuideSnapshotJson(guide);
        return trip;
    }
}
