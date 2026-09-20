package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.common.util.Money;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.entity.BlindBoxMood;
import com.tuge.domain.entity.BlindBoxScene;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.BlindBoxMoodMapper;
import com.tuge.domain.mapper.BlindBoxSceneMapper;
import com.tuge.domain.vo.BlindBoxVO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 用户端盲盒（阶段一：上架列表与详情）
 */
@Service
public class BlindBoxService {

    private static final Set<String> MOODS = Set.of("happy", "emo", "bored", "curious");

    private final BlindBoxMapper blindBoxMapper;
    private final BlindBoxMoodMapper moodMapper;
    private final BlindBoxSceneMapper sceneMapper;
    private final ObjectMapper objectMapper;

    public BlindBoxService(BlindBoxMapper blindBoxMapper, BlindBoxMoodMapper moodMapper,
                           BlindBoxSceneMapper sceneMapper, ObjectMapper objectMapper) {
        this.blindBoxMapper = blindBoxMapper;
        this.moodMapper = moodMapper;
        this.sceneMapper = sceneMapper;
        this.objectMapper = objectMapper;
    }

    /**
     * 上架盲盒列表，可选按分类与心情过滤
     */
    public List<BlindBoxVO> listBoxes(String category, String mood) {
        LambdaQueryWrapper<BlindBox> wrapper = listQuery(category, mood, null);
        wrapper.orderByDesc(BlindBox::getSortWeight).orderByAsc(BlindBox::getId);
        List<BlindBox> rows = blindBoxMapper.selectList(wrapper);
        return toVOList(rows);
    }

    public PageResult<BlindBoxVO> listBoxesPage(String category, String mood, String keyword,
                                                 String sort, long page, long pageSize) {
        LambdaQueryWrapper<BlindBox> wrapper = listQuery(category, mood, keyword);
        String order = sort == null || sort.isBlank() ? "default" : sort;
        switch (order) {
            case "default" -> wrapper.orderByDesc(BlindBox::getSortWeight).orderByAsc(BlindBox::getId);
            case "price_asc" -> wrapper.orderByAsc(BlindBox::getPriceCent).orderByAsc(BlindBox::getId);
            case "price_desc" -> wrapper.orderByDesc(BlindBox::getPriceCent).orderByAsc(BlindBox::getId);
            case "popular" -> wrapper.orderByDesc(BlindBox::getOpenCount).orderByAsc(BlindBox::getId);
            default -> throw new BusinessException(400, "排序参数不合法: " + order);
        }
        long current = Math.max(1, page);
        long size = Math.min(100, Math.max(1, pageSize));
        Page<BlindBox> rows = blindBoxMapper.selectPage(new Page<>(current, size), wrapper);
        return PageResult.of(toVOList(rows.getRecords()), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    private LambdaQueryWrapper<BlindBox> listQuery(String category, String mood, String keyword) {
        LambdaQueryWrapper<BlindBox> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BlindBox::getStatus, "on");
        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            wrapper.eq(BlindBox::getCategory, category);
        }
        if (keyword != null && !keyword.isBlank()) {
            String value = keyword.trim();
            wrapper.and(query -> query.like(BlindBox::getName, value)
                    .or().like(BlindBox::getIntro, value)
                    .or().like(BlindBox::getDescription, value));
        }
        if (mood != null && !mood.isBlank() && !"all".equalsIgnoreCase(mood)) {
            validateMood(mood);
            List<Long> ids = moodMapper.selectList(
                            new LambdaQueryWrapper<BlindBoxMood>().eq(BlindBoxMood::getMood, mood))
                    .stream()
                    .map(BlindBoxMood::getBoxId)
                    .distinct()
                    .toList();
            if (ids.isEmpty()) wrapper.apply("1 = 0");
            else wrapper.in(BlindBox::getId, ids);
        }
        return wrapper;
    }

    private List<BlindBoxVO> toVOList(List<BlindBox> rows) {
        List<Long> ids = rows.stream().map(BlindBox::getId).toList();
        Map<Long, List<String>> moodMap = loadMoods(ids);
        Map<Long, List<String>> sceneMap = loadScenes(ids);
        return rows.stream().map(box -> toVO(box,
                moodMap.getOrDefault(box.getId(), List.of()),
                sceneMap.getOrDefault(box.getId(), List.of()))).toList();
    }

    /**
     * 盲盒详情保留历史可见性；下架状态由客户端禁用购买，订单接口再次兜底。
     */
    public BlindBoxVO getBox(Long id) {
        BlindBox box = blindBoxMapper.selectById(id);
        if (box == null) {
            throw new BusinessException(404, "盲盒不存在");
        }
        Map<Long, List<String>> moodMap = loadMoods(List.of(id));
        Map<Long, List<String>> sceneMap = loadScenes(List.of(id));
        return toVO(box, moodMap.getOrDefault(id, List.of()), sceneMap.getOrDefault(id, List.of()));
    }

    private Map<Long, List<String>> loadMoods(List<Long> ids) {
        Map<Long, List<String>> map = new HashMap<>();
        if (ids == null || ids.isEmpty()) {
            return map;
        }
        moodMapper.selectList(new LambdaQueryWrapper<BlindBoxMood>().in(BlindBoxMood::getBoxId, ids))
                .forEach(row -> map.computeIfAbsent(row.getBoxId(), k -> new ArrayList<>()).add(row.getMood()));
        return map;
    }

    private Map<Long, List<String>> loadScenes(List<Long> ids) {
        Map<Long, List<String>> map = new HashMap<>();
        if (ids == null || ids.isEmpty()) {
            return map;
        }
        sceneMapper.selectList(new LambdaQueryWrapper<BlindBoxScene>().in(BlindBoxScene::getBoxId, ids))
                .forEach(row -> map.computeIfAbsent(row.getBoxId(), k -> new ArrayList<>()).add(row.getScene()));
        return map;
    }

    private void validateMood(String mood) {
        if (!MOODS.contains(mood)) {
            throw new BusinessException(400, "心情参数不合法: " + mood);
        }
    }

    private BlindBoxVO toVO(BlindBox box, List<String> moods, List<String> scenes) {
        BlindBoxVO vo = new BlindBoxVO();
        vo.setId(box.getId());
        vo.setName(box.getName());
        vo.setCategory(box.getCategory());
        vo.setTag(box.getTag());
        vo.setRankTag(box.getRankTag());
        vo.setIntro(box.getIntro());
        vo.setDescription(box.getDescription());
        vo.setPrice(Money.yuan(box.getPriceCent()));
        vo.setMinValue(Money.yuan(box.getMinValueCent()));
        vo.setCoverUrl(box.getCoverUrl());
        List<String> imageUrls = readList(box.getImagesJson());
        vo.setImageUrls(imageUrls.isEmpty() && box.getCoverUrl() != null ? List.of(box.getCoverUrl()) : imageUrls);
        vo.setMoods(moods);
        vo.setScenes(scenes);
        vo.setIncludes(readList(box.getIncludesJson()));
        vo.setGuidePreview(readMap(box.getGuidePreviewJson()));
        vo.setStatus(box.getStatus());
        vo.setOpenCount(box.getOpenCount());
        vo.setVersion(box.getVersion());
        return vo;
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }
}
