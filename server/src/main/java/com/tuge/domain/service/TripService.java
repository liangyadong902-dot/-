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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TripService {
    private final TripMapper tripMapper;
    private final ObjectMapper objectMapper;

    public TripService(TripMapper tripMapper, ObjectMapper objectMapper) {
        this.tripMapper = tripMapper;
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

    public Map<String, Object> guide(Long userId, Long id) {
        Trip trip = find(userId, id);
        Map<String, Object> guide = readGuide(trip.getGuideSnapshotJson());
        if (guide.isEmpty()) guide = defaultGuide(trip);
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

    private Map<String, Object> defaultGuide(Trip trip) {
        int days = "cross".equals(trip.getBoxCategory()) ? 3 : "province".equals(trip.getBoxCategory()) ? 2 : 1;
        String duration = days == 1 ? "一日轻旅行" : days + "天" + (days - 1) + "夜";
        List<String> includes = parseInclude(trip.getIncludeJson());
        Map<String, Object> guide = new LinkedHashMap<>();
        guide.put("overview", trip.getHighlight());
        guide.put("durationText", duration);
        guide.put("schedules", List.of(
                Map.of("dayNo", 1, "time", "08:30", "title", "集合出发", "description", "核验订单并确认返程安排。"),
                Map.of("dayNo", 1, "time", "10:30", "title", trip.getRouteName(), "description", trip.getHighlight()),
                Map.of("dayNo", days, "time", "17:00", "title", "集合返程", "description", "清点随身物品并按约定地点返程。")
        ));
        guide.put("spots", List.of(Map.of(
                "spotId", "route-" + trip.getRouteId(),
                "name", trip.getLocation(),
                "coverUrl", "",
                "highlights", trip.getHighlight(),
                "notice", "开放时间与现场安排以出发前通知为准。",
                "durationMinutes", days * 240
        )));
        guide.put("transport", List.of(Map.of("title", "集合与接驳", "description", "出发前一天在行程页确认集合点和车辆信息。")));
        guide.put("dining", List.of(Map.of("title", "餐饮安排", "description", includes.stream().anyMatch(v -> v.contains("餐")) ? "订单已包含页面标明的餐饮权益。" : "餐饮以自理为主，建议预留机动预算。")));
        guide.put("lodging", days > 1 ? List.of(Map.of("title", "住宿安排", "description", "入住信息在出发前通知中确认。")) : List.of());
        guide.put("budgetItems", List.of(
                Map.of("name", "盲盒订单", "amount", trip.getPriceCent() == null ? 0 : trip.getPriceCent() / 100.0, "required", true),
                Map.of("name", "个人机动消费", "amount", days * 100, "required", false)
        ));
        guide.put("checklist", includes.isEmpty() ? List.of("身份证件", "充电宝", "舒适步行鞋", "轻便雨具") : includes);
        guide.put("planB", "如遇天气或景区临时调整，以安全为先切换室内点位，并保留返程时间。 ");
        guide.put("safetyTips", List.of("提前确认天气和集合时间", "不进入未开放区域", "保管好证件与订单信息"));
        guide.put("faqs", List.of(
                Map.of("question", "集合信息在哪里查看？", "answer", "出发前一天在行程详情和订单通知中查看。"),
                Map.of("question", "临时天气变化怎么办？", "answer", "按 Plan B 调整，涉及权益变化时以订单通知为准。")
        ));
        return guide;
    }

    private int safePage(long page) { return (int) Math.max(1, page); }
    private int safePageSize(long pageSize) { return (int) Math.min(100, Math.max(1, pageSize)); }
}
