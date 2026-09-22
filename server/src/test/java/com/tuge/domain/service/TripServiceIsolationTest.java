package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TripServiceIsolationTest {

    private TripMapper tripMapper;
    private TripService service;

    @BeforeEach
    void setUp() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), Trip.class);
        tripMapper = mock(TripMapper.class);
        service = new TripService(tripMapper, mock(TravelRouteMapper.class), mock(com.tuge.domain.mapper.BlindBoxMapper.class), new ObjectMapper());
    }

    @Test
    @SuppressWarnings("unchecked")
    void hidesAnotherUsersTripAsNotFound() {
        when(tripMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        assertThatThrownBy(() -> service.detail(20L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo(404);

        ArgumentCaptor<LambdaQueryWrapper<Trip>> query = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(tripMapper).selectOne(query.capture());
        query.getValue().getSqlSegment();
        assertThat(query.getValue().getParamNameValuePairs().values()).contains(20L, 99L);
    }
}
