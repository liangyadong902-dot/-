package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.domain.entity.Badge;
import com.tuge.domain.entity.UserBadge;
import com.tuge.domain.mapper.BadgeMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.vo.BadgeListVO;
import com.tuge.domain.vo.BadgeVO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * 用户端徽章图鉴（阶段一：定义列表，未登录全部未解锁）
 */
@Service
public class BadgeService {

    private final BadgeMapper badgeMapper;
    private final UserBadgeMapper userBadgeMapper;

    public BadgeService(BadgeMapper badgeMapper, UserBadgeMapper userBadgeMapper) {
        this.badgeMapper = badgeMapper;
        this.userBadgeMapper = userBadgeMapper;
    }

    public BadgeListVO listAll(Long userId) {
        List<Badge> rows = badgeMapper.selectList(
                new LambdaQueryWrapper<Badge>()
                        .orderByDesc(Badge::getSortWeight)
                        .orderByAsc(Badge::getId));
        BadgeListVO data = new BadgeListVO();
        data.setTotal(rows.size());
        Map<Long, UserBadge> unlocked = new HashMap<>();
        if (userId != null && !rows.isEmpty()) {
            userBadgeMapper.selectList(new LambdaQueryWrapper<UserBadge>()
                            .eq(UserBadge::getUserId, userId)
                            .in(UserBadge::getBadgeId, rows.stream().map(Badge::getId).toList()))
                    .forEach(row -> unlocked.put(row.getBadgeId(), row));
        }
        data.setList(rows.stream().map(row -> toVO(row, unlocked.get(row.getId()))).toList());
        return data;
    }

    private BadgeVO toVO(Badge row, UserBadge unlocked) {
        BadgeVO vo = new BadgeVO();
        vo.setId(row.getId());
        vo.setName(row.getName());
        vo.setMark(row.getMark());
        vo.setDescription(row.getDescription());
        vo.setUnlocked(unlocked != null);
        vo.setUnlockedAt(unlocked == null ? null : unlocked.getUnlockedAt().toString());
        return vo;
    }
}
