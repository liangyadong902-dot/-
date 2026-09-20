package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.entity.DiaryTemplate;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.DiaryTemplateMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.DiaryResultVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiDiaryService {
    private final TripMapper tripMapper;
    private final DiaryTemplateMapper templateMapper;
    private final AiConfigService configService;
    private final DeepSeekClient deepSeekClient;

    public AiDiaryService(TripMapper tripMapper, DiaryTemplateMapper templateMapper,
                          AiConfigService configService, DeepSeekClient deepSeekClient) {
        this.tripMapper = tripMapper;
        this.templateMapper = templateMapper;
        this.configService = configService;
        this.deepSeekClient = deepSeekClient;
    }

    @Transactional
    public DiaryResultVO generate(Long userId, Long tripId) {
        Trip trip = tripMapper.selectOne(new LambdaQueryWrapper<Trip>()
                .eq(Trip::getId, tripId).eq(Trip::getUserId, userId).last("LIMIT 1"));
        if (trip == null) throw new BusinessException(404, "行程不存在");
        if (trip.getDiaryText() != null && !trip.getDiaryText().isBlank()) {
            return new DiaryResultVO(trip.getDiaryText(), false);
        }
        if (!"valid".equals(trip.getValidity())) throw new BusinessException(409, "无效行程不能生成新日记");

        boolean fallback = true;
        String diary;
        try {
            if (!configService.modelEnabled()) throw new IllegalStateException("AI model disabled by config");
            DeepSeekClient.ModelReply reply = deepSeekClient.chat(messages(trip));
            diary = reply.content();
            if (!containsFacts(diary, trip)) throw new IllegalStateException("AI diary omitted required facts");
            fallback = false;
        } catch (RuntimeException modelFailure) {
            if (!configService.fallbackEnabled()) {
                throw new BusinessException(503, "AI 日记服务暂时不可用");
            }
            diary = template(trip);
        }

        LocalDateTime now = LocalDateTime.now();
        int updated = tripMapper.update(null, new LambdaUpdateWrapper<Trip>()
                .eq(Trip::getId, tripId).eq(Trip::getUserId, userId).eq(Trip::getValidity, "valid")
                .and(wrapper -> wrapper.isNull(Trip::getDiaryText).or().eq(Trip::getDiaryText, ""))
                .set(Trip::getDiaryText, diary).set(Trip::getDiaryAt, now));
        if (updated == 0) {
            Trip current = tripMapper.selectById(tripId);
            if (current != null && current.getDiaryText() != null && !current.getDiaryText().isBlank()) {
                return new DiaryResultVO(current.getDiaryText(), false);
            }
            throw new BusinessException(409, "日记生成状态已变化，请刷新后重试");
        }
        return new DiaryResultVO(diary, fallback);
    }

    private List<Map<String, String>> messages(Trip trip) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(message("system", configService.diaryPrompt()));
        messages.add(message("user", "线路名称=" + safe(trip.getRouteName())
                + "；目的地=" + safe(trip.getLocation())
                + "；亮点=" + safe(trip.getHighlight())
                + "；情绪文案=" + safe(trip.getMoodText())
                + "；购入价=" + cents(trip.getPriceCent()) + "元"
                + "；票面价值=" + cents(trip.getValueCent()) + "元。"));
        return messages;
    }

    private String template(Trip trip) {
        DiaryTemplate row = templateMapper.selectOne(new LambdaQueryWrapper<DiaryTemplate>()
                .eq(DiaryTemplate::getStatus, "on")
                .orderByDesc(DiaryTemplate::getSortWeight).orderByAsc(DiaryTemplate::getId).last("LIMIT 1"));
        String value = row == null ? "今天在{目的地}走了一段{线路名称}。{亮点} 购入价{购入价}元，票面{票面价值}元。\n—— AI生成"
                : row.getContent();
        value = value.replace("{线路名称}", safe(trip.getRouteName()))
                .replace("{目的地}", safe(trip.getLocation()))
                .replace("{亮点}", safe(trip.getHighlight()))
                .replace("{情绪文案}", safe(trip.getMoodText()))
                .replace("{购入价}", cents(trip.getPriceCent()))
                .replace("{票面价值}", cents(trip.getValueCent()));
        if (!containsFacts(value, trip)) {
            value = "今天在" + safe(trip.getLocation()) + "走了一段" + safe(trip.getRouteName()) + "。"
                    + safe(trip.getHighlight()) + " 购入价" + cents(trip.getPriceCent())
                    + "元，票面" + cents(trip.getValueCent()) + "元。\n—— AI生成";
        }
        return value;
    }

    private static boolean containsFacts(String diary, Trip trip) {
        return diary != null && diary.contains(safe(trip.getLocation())) && diary.contains(safe(trip.getHighlight()));
    }

    private static String cents(Integer value) {
        int cents = value == null ? 0 : value;
        return java.math.BigDecimal.valueOf(cents).movePointLeft(2).stripTrailingZeros().toPlainString();
    }

    private static String safe(String value) { return value == null || value.isBlank() ? "旅途" : value; }

    private static Map<String, String> message(String role, String content) {
        Map<String, String> value = new LinkedHashMap<>();
        value.put("role", role);
        value.put("content", content);
        return value;
    }
}
