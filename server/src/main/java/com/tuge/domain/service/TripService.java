package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.TripVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class TripService {
    private final TripMapper tripMapper;
    private final ObjectMapper objectMapper;

    public TripService(TripMapper tripMapper, ObjectMapper objectMapper) {
        this.tripMapper = tripMapper;
        this.objectMapper = objectMapper;
    }

    public PageResult<TripVO> list(Long userId, long page, long pageSize) {
        Page<Trip> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<Trip> rows = tripMapper.selectPage(result, new LambdaQueryWrapper<Trip>()
                .eq(Trip::getUserId, userId).orderByDesc(Trip::getOpenedDate).orderByDesc(Trip::getId));
        return PageResult.of(rows.getRecords().stream().map(this::toVO).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public TripVO detail(Long userId, Long id) {
        return toVO(find(userId, id));
    }

    @Transactional
    public String diary(Long userId, Long id) {
        Trip trip = find(userId, id);
        if (trip.getDiaryText() == null || trip.getDiaryText().isBlank()) {
            trip.setDiaryText("今天打开了「" + trip.getBoxName() + "」，目的地是" + trip.getLocation()
                    + "。" + trip.getMoodText() + " 期待在" + trip.getRouteName() + "留下新的风景。");
            trip.setDiaryAt(LocalDateTime.now());
            tripMapper.updateById(trip);
        }
        return trip.getDiaryText();
    }

    private Trip find(Long userId, Long id) {
        Trip trip = tripMapper.selectOne(new LambdaQueryWrapper<Trip>().eq(Trip::getId, id).eq(Trip::getUserId, userId));
        if (trip == null) throw new BusinessException(404, "行程不存在");
        return trip;
    }

    private TripVO toVO(Trip trip) {
        TripVO vo = new TripVO();
        vo.setId(trip.getId());
        vo.setOrderId(trip.getOrderId());
        vo.setBoxId(trip.getBoxId());
        vo.setBoxName(trip.getBoxName());
        vo.setBoxCategory(trip.getBoxCategory());
        vo.setPriceCent(trip.getPriceCent());
        vo.setRouteName(trip.getRouteName());
        vo.setLocation(trip.getLocation());
        vo.setValueCent(trip.getValueCent());
        vo.setHighlight(trip.getHighlight());
        vo.setIncludeList(parseInclude(trip.getIncludeJson()));
        vo.setMoodText(trip.getMoodText());
        vo.setBadgeName(trip.getBadgeName());
        vo.setValidity(trip.getValidity());
        vo.setDiaryText(trip.getDiaryText());
        vo.setDiaryAt(trip.getDiaryAt());
        vo.setOpenedDate(trip.getOpenedDate());
        return vo;
    }

    private List<String> parseInclude(String value) {
        if (value == null || value.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(value, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            return List.of(value);
        }
    }

    private int safePage(long page) { return (int) Math.max(1, page); }
    private int safePageSize(long pageSize) { return (int) Math.min(100, Math.max(1, pageSize)); }
}
