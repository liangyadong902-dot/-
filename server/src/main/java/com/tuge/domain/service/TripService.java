package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.entity.TravelRoute;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.vo.TripVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TripService {
    private final TripMapper tripMapper;
    private final TravelRouteMapper routeMapper;
    private final BlindBoxMapper boxMapper;
    private final ObjectMapper objectMapper;

    public TripService(TripMapper tripMapper, TravelRouteMapper routeMapper, BlindBoxMapper boxMapper, ObjectMapper objectMapper) {
        this.tripMapper = tripMapper;
        this.routeMapper = routeMapper;
        this.boxMapper = boxMapper;
        this.objectMapper = objectMapper;
    }

    public PageResult<TripVO> list(Long userId, String validity, long page, long pageSize) {
        String effectiveValidity = validity == null || validity.isBlank() ? "valid" : validity;
        Page<Trip> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<Trip> rows = tripMapper.selectPage(result, new LambdaQueryWrapper<Trip>()
                .eq(Trip::getUserId, userId)
                .eq(Trip::getValidity, effectiveValidity)
                .orderByDesc(Trip::getOpenedDate).orderByDesc(Trip::getId));
        return PageResult.of(rows.getRecords().stream().map(this::toVO).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public TripVO detail(Long userId, Long id) {
        return toVO(find(userId, id));
    }

    @Transactional
    public Map<String, Object> guide(Long userId, Long id) {
        Trip trip = find(userId, id);
        Map<String, Object> guide = readGuide(trip.getGuideSnapshotJson());
        if (guide.isEmpty()) {
            TravelRoute route = routeMapper.selectById(trip.getRouteId());
            guide = route == null ? Map.of() : readGuide(route.getGuideJson());
            if (guide.isEmpty()) throw new BusinessException(409, "该线路尚未配置出行攻略");
            trip.setGuideSnapshotJson(route.getGuideJson());
            trip.setGuideVersion(route.getGuideVersion() == null ? 1 : route.getGuideVersion());
            tripMapper.updateById(trip);
        }
        Map<String, Object> result = new LinkedHashMap<>(guide);
        result.put("tripId", trip.getId());
        result.put("routeName", trip.getRouteName());
        result.put("snapshotVersion", trip.getGuideVersion() == null ? 1 : trip.getGuideVersion());
        return result;
    }

    @Transactional
    public String diary(Long userId, Long id) {
        Trip trip = find(userId, id);
        if (trip.getDiaryText() == null || trip.getDiaryText().isBlank()) {
            // 阶段三模板降级：目的地 + 亮点拼接；阶段四替换为模型生成
            String highlight = trip.getHighlight() == null || trip.getHighlight().isBlank()
                    ? "这一路的风景刚刚好。" : trip.getHighlight();
            trip.setDiaryText("今天在" + trip.getLocation() + "走了一段" + trip.getRouteName() + "。"
                    + highlight
                    + " 购入价" + String.format("%.0f", trip.getPriceCent() / 100.0) + "元，"
                    + "票面" + String.format("%.0f", trip.getValueCent() / 100.0) + "元。\n—— AI生成");
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
        // 行程卡封面直接随行程下发，避免小程序端依赖「当前上架盲盒目录」反查导致部分图片不显示
        BlindBox box = trip.getBoxId() == null ? null : boxMapper.selectById(trip.getBoxId());
        vo.setBoxCoverUrl(box == null ? null : box.getCoverUrl());
        vo.setBoxCategory(trip.getBoxCategory());
        vo.setPriceCent(trip.getPriceCent());
        vo.setRouteName(trip.getRouteName());
        vo.setLocation(trip.getLocation());
        vo.setValueCent(trip.getValueCent());
        vo.setHighlight(trip.getHighlight());
        vo.setIncludeList(parseInclude(trip.getIncludeJson()));
        vo.setGuideVersion(trip.getGuideVersion());
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

    private Map<String, Object> readGuide(String value) {
        if (value == null || value.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(value, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private int safePage(long page) { return (int) Math.max(1, page); }
    private int safePageSize(long pageSize) { return (int) Math.min(100, Math.max(1, pageSize)); }
}
