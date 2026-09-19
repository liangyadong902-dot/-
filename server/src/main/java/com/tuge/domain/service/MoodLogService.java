package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.MoodLogRequest;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.entity.MoodLog;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.MoodLogMapper;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class MoodLogService {

    private static final Set<String> MOODS = Set.of("happy", "emo", "bored", "curious");

    private final MoodLogMapper moodLogMapper;
    private final BlindBoxMapper blindBoxMapper;

    public MoodLogService(MoodLogMapper moodLogMapper, BlindBoxMapper blindBoxMapper) {
        this.moodLogMapper = moodLogMapper;
        this.blindBoxMapper = blindBoxMapper;
    }

    public void create(MoodLogRequest request, Long userId) {
        if (request == null || request.mood() == null || !MOODS.contains(request.mood())) {
            throw new BusinessException(400, "心情参数不合法");
        }
        if (request.boxId() != null && blindBoxMapper.selectOne(new LambdaQueryWrapper<BlindBox>()
                .eq(BlindBox::getId, request.boxId()).eq(BlindBox::getStatus, "on")) == null) {
            throw new BusinessException(400, "盲盒不存在或已下架");
        }
        MoodLog log = new MoodLog();
        log.setUserId(userId);
        log.setMood(request.mood());
        log.setBoxId(request.boxId());
        moodLogMapper.insert(log);
    }
}
