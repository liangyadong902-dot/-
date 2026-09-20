package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.entity.DiaryTemplate;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.DiaryTemplateMapper;
import com.tuge.domain.mapper.TripMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiDiaryServiceTest {
    private TripMapper tripMapper;
    private DiaryTemplateMapper templateMapper;
    private AiConfigService configService;
    private DeepSeekClient deepSeekClient;
    private AiDiaryService service;

    @BeforeEach
    void setUp() {
        initTable(Trip.class); initTable(DiaryTemplate.class);
        tripMapper = mock(TripMapper.class); templateMapper = mock(DiaryTemplateMapper.class);
        configService = mock(AiConfigService.class); deepSeekClient = mock(DeepSeekClient.class);
        service = new AiDiaryService(tripMapper, templateMapper, configService, deepSeekClient);
    }

    @Test
    void rejectsMissingOrForeignTripBeforeCallingModel() {
        when(tripMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        assertThatThrownBy(() -> service.generate(7L, 99L))
                .isInstanceOf(BusinessException.class).extracting("code").isEqualTo(404);
        verify(deepSeekClient, never()).chat(any());
    }

    @Test
    void returnsExistingDiaryIdempotently() {
        Trip trip = trip(); trip.setDiaryText("已有日记");
        when(tripMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(trip);

        var result = service.generate(7L, 9L);

        assertThat(result.diaryText()).isEqualTo("已有日记");
        assertThat(result.fallback()).isFalse();
        verify(tripMapper, never()).update(isNull(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void modelFailureUsesFactCompleteTemplateAndConditionalUpdate() {
        Trip trip = trip();
        when(tripMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(trip);
        when(configService.modelEnabled()).thenReturn(false);
        when(configService.fallbackEnabled()).thenReturn(true);
        DiaryTemplate template = new DiaryTemplate(); template.setContent("今天去了{目的地}，{亮点}");
        when(templateMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(template);
        when(tripMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        var result = service.generate(7L, 9L);

        assertThat(result.fallback()).isTrue();
        assertThat(result.diaryText()).contains("成都", "看熊猫");
        verify(tripMapper).update(isNull(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void concurrentWinnerIsReturnedWithoutOverwrite() {
        Trip trip = trip();
        when(tripMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(trip);
        when(configService.modelEnabled()).thenReturn(false);
        when(configService.fallbackEnabled()).thenReturn(true);
        when(templateMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(tripMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(0);
        Trip winner = trip(); winner.setDiaryText("另一个请求已写入");
        when(tripMapper.selectById(9L)).thenReturn(winner);

        assertThat(service.generate(7L, 9L).diaryText()).isEqualTo("另一个请求已写入");
    }

    @Test
    void invalidTripCannotGenerateNewDiary() {
        Trip trip = trip(); trip.setValidity("invalid");
        when(tripMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(trip);

        assertThatThrownBy(() -> service.generate(7L, 9L))
                .isInstanceOf(BusinessException.class).extracting("code").isEqualTo(409);
    }

    private static Trip trip() {
        Trip row = new Trip(); row.setId(9L); row.setUserId(7L); row.setValidity("valid");
        row.setRouteName("熊猫基地慢游"); row.setLocation("成都"); row.setHighlight("看熊猫");
        row.setMoodText("松弛"); row.setPriceCent(9900); row.setValueCent(14800);
        return row;
    }

    private static void initTable(Class<?> entityType) {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityType);
    }
}
