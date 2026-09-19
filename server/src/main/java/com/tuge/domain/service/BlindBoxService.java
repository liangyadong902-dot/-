package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
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

    public BlindBoxService(BlindBoxMapper blindBoxMapper, BlindBoxMoodMapper moodMapper,
                           BlindBoxSceneMapper sceneMapper) {
        this.blindBoxMapper = blindBoxMapper;
        this.moodMapper = moodMapper;
        this.sceneMapper = sceneMapper;
    }

    /**
     * 上架盲盒列表，可选按分类与心情过滤
     */
    public List<BlindBoxVO> listBoxes(String category, String mood) {
        LambdaQueryWrapper<BlindBox> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BlindBox::getStatus, "on");
        if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            wrapper.eq(BlindBox::getCategory, category);
        }
        if (mood != null && !mood.isBlank() && !"all".equalsIgnoreCase(mood)) {
            validateMood(mood);
            List<Long> ids = moodMapper.selectList(
                            new LambdaQueryWrapper<BlindBoxMood>().eq(BlindBoxMood::getMood, mood))
                    .stream()
                    .map(BlindBoxMood::getBoxId)
                    .distinct()
                    .toList();
            if (ids.isEmpty()) {
                return List.of();
            }
            wrapper.in(BlindBox::getId, ids);
        }
        wrapper.orderByDesc(BlindBox::getSortWeight).orderByAsc(BlindBox::getId);
        List<BlindBox> rows = blindBoxMapper.selectList(wrapper);
        List<Long> ids = rows.stream().map(BlindBox::getId).toList();
        Map<Long, List<String>> moodMap = loadMoods(ids);
        Map<Long, List<String>> sceneMap = loadScenes(ids);
        return rows.stream().map(box -> toVO(box,
                moodMap.getOrDefault(box.getId(), List.of()),
                sceneMap.getOrDefault(box.getId(), List.of()))).toList();
    }

    /**
     * 上架盲盒详情
     */
    public BlindBoxVO getBox(Long id) {
        BlindBox box = blindBoxMapper.selectById(id);
        if (box == null || !"on".equals(box.getStatus())) {
            throw new BusinessException(404, "盲盒不存在或已下架");
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
        vo.setPrice(Money.yuan(box.getPriceCent()));
        vo.setMinValue(Money.yuan(box.getMinValueCent()));
        vo.setCoverUrl(box.getCoverUrl());
        vo.setMoods(moods);
        vo.setScenes(scenes);
        vo.setStatus(box.getStatus());
        return vo;
    }
}
