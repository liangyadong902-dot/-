package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.domain.entity.Achievement;
import com.tuge.domain.entity.UserAchievement;
import com.tuge.domain.mapper.AchievementMapper;
import com.tuge.domain.mapper.UserAchievementMapper;
import com.tuge.domain.mapper.CheckinMapper;
import com.tuge.domain.mapper.CommunityPostMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.vo.AchievementVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AchievementService {
    private final AchievementMapper achievementMapper;
    private final UserAchievementMapper userAchievementMapper;
    private final CheckinMapper checkinMapper;
    private final CommunityPostMapper postMapper;
    private final TripMapper tripMapper;
    private final UserBadgeMapper badgeMapper;

    public AchievementService(AchievementMapper achievementMapper, UserAchievementMapper userAchievementMapper,
                              CheckinMapper checkinMapper, CommunityPostMapper postMapper, TripMapper tripMapper,
                              UserBadgeMapper badgeMapper) {
        this.achievementMapper = achievementMapper;
        this.userAchievementMapper = userAchievementMapper;
        this.checkinMapper = checkinMapper;
        this.postMapper = postMapper;
        this.tripMapper = tripMapper;
        this.badgeMapper = badgeMapper;
    }

    public List<AchievementVO> list(Long userId) {
        List<Achievement> definitions = achievementMapper.selectList(new LambdaQueryWrapper<Achievement>()
                .eq(Achievement::getStatus, "on").orderByAsc(Achievement::getLevel).orderByDesc(Achievement::getSortWeight));
        return definitions.stream().map(def -> toVO(userId, def)).toList();
    }

    @Transactional
    public List<AchievementVO> check(Long userId) {
        List<Achievement> definitions = achievementMapper.selectList(new LambdaQueryWrapper<Achievement>().eq(Achievement::getStatus, "on"));
        definitions.forEach(def -> {
            int progress = progress(userId, def.getRequirementType());
            UserAchievement current = userAchievementMapper.selectOne(new LambdaQueryWrapper<UserAchievement>()
                    .eq(UserAchievement::getUserId, userId).eq(UserAchievement::getAchievementId, def.getId()));
            if (current == null) {
                current = new UserAchievement(); current.setUserId(userId); current.setAchievementId(def.getId());
                current.setRewardSent(false); current.setUnlocked(false);
            }
            current.setProgress(progress);
            if (!Boolean.TRUE.equals(current.getUnlocked()) && progress >= def.getRequirementValue()) {
                current.setUnlocked(true); current.setUnlockedAt(java.time.LocalDateTime.now());
            }
            if (current.getId() == null) {
                userAchievementMapper.insert(current);
            } else {
                userAchievementMapper.updateById(current);
            }
        });
        return list(userId);
    }

    private int progress(Long userId, String type) {
        return switch (type) {
            case "checkin_count" -> Math.toIntExact(checkinMapper.selectCount(new LambdaQueryWrapper<com.tuge.domain.entity.Checkin>().eq(com.tuge.domain.entity.Checkin::getUserId, userId)));
            case "trip_count" -> Math.toIntExact(tripMapper.selectCount(new LambdaQueryWrapper<com.tuge.domain.entity.Trip>().eq(com.tuge.domain.entity.Trip::getUserId, userId).eq(com.tuge.domain.entity.Trip::getValidity, "valid")));
            case "badge_count" -> Math.toIntExact(badgeMapper.selectCount(new LambdaQueryWrapper<com.tuge.domain.entity.UserBadge>().eq(com.tuge.domain.entity.UserBadge::getUserId, userId)));
            case "post_count" -> Math.toIntExact(postMapper.selectCount(new LambdaQueryWrapper<com.tuge.domain.entity.CommunityPost>().eq(com.tuge.domain.entity.CommunityPost::getUserId, userId).eq(com.tuge.domain.entity.CommunityPost::getStatus, "on")));
            default -> 0;
        };
    }

    private AchievementVO toVO(Long userId, Achievement def) {
        UserAchievement state = userAchievementMapper.selectOne(new LambdaQueryWrapper<UserAchievement>()
                .eq(UserAchievement::getUserId, userId).eq(UserAchievement::getAchievementId, def.getId()));
        AchievementVO vo = new AchievementVO(); vo.setId(def.getId()); vo.setCode(def.getCode()); vo.setName(def.getName());
        vo.setDescription(def.getDescription()); vo.setIconUrl(def.getIconUrl()); vo.setRequirementType(def.getRequirementType());
        vo.setRequirementValue(def.getRequirementValue()); vo.setLevel(def.getLevel()); vo.setSortWeight(def.getSortWeight());
        vo.setProgress(state == null ? 0 : state.getProgress()); vo.setUnlocked(state != null && Boolean.TRUE.equals(state.getUnlocked()));
        vo.setUnlockedAt(state == null ? null : state.getUnlockedAt()); return vo;
    }
}
