package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.entity.Achievement;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.Checkin;
import com.tuge.domain.entity.CommunityPost;
import com.tuge.domain.entity.UserAchievement;
import com.tuge.domain.entity.UserBadge;
import com.tuge.domain.mapper.AchievementMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.CheckinMapper;
import com.tuge.domain.mapper.CommunityPostMapper;
import com.tuge.domain.mapper.UserAchievementMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.AchievementVO;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AchievementService {
    private final AchievementMapper achievementMapper;
    private final UserAchievementMapper userAchievementMapper;
    private final CheckinMapper checkinMapper;
    private final CommunityPostMapper postMapper;
    private final UserBadgeMapper badgeMapper;
    private final BizOrderMapper orderMapper;
    private final TripMapper tripMapper;

    public AchievementService(AchievementMapper achievementMapper, UserAchievementMapper userAchievementMapper,
                              CheckinMapper checkinMapper, CommunityPostMapper postMapper,
                              UserBadgeMapper badgeMapper, BizOrderMapper orderMapper, TripMapper tripMapper) {
        this.achievementMapper = achievementMapper; this.userAchievementMapper = userAchievementMapper;
        this.checkinMapper = checkinMapper; this.postMapper = postMapper; this.badgeMapper = badgeMapper; this.orderMapper = orderMapper; this.tripMapper = tripMapper;
    }

    public List<AchievementVO> list(Long userId, String state) {
        List<Achievement> definitions = achievementMapper.selectList(new LambdaQueryWrapper<Achievement>().eq(Achievement::getStatus, "on").orderByDesc(Achievement::getSortWeight).orderByAsc(Achievement::getId));
        List<AchievementVO> result = new ArrayList<>();
        for (Achievement definition : definitions) {
            UserAchievement progress = userId == null ? null : findProgress(userId, definition.getId());
            AchievementVO vo = toVO(definition, progress, userId);
            if (state == null || state.isBlank() || state.equals(vo.getState())) result.add(vo);
        }
        return result;
    }

    public AchievementVO detail(Long userId, String code) {
        Achievement definition = achievementMapper.selectOne(new LambdaQueryWrapper<Achievement>().eq(Achievement::getCode, code).eq(Achievement::getStatus, "on"));
        if (definition == null) throw new BusinessException(404, "成就不存在");
        return toVO(definition, userId == null ? null : findProgress(userId, definition.getId()), userId);
    }

    public AchievementVO definition(Achievement definition) {
        if (definition == null) throw new BusinessException(404, "成就不存在");
        return toVO(definition, null, null);
    }

    @Transactional
    public List<AchievementVO> check(Long userId, String eventType, String bizType, Long bizId) {
        if (userId == null) throw new BusinessException(401, "请先登录");
        List<AchievementVO> changed = new ArrayList<>();
        for (Achievement definition : achievementMapper.selectList(new LambdaQueryWrapper<Achievement>().eq(Achievement::getStatus, "on"))) {
            UserAchievement old = findProgress(userId, definition.getId());
            int progress = measure(userId, definition.getRequirementType());
            boolean unlockedBefore = old != null && old.getUnlocked() != null && old.getUnlocked() == 1;
            UserAchievement item = old == null ? new UserAchievement() : old;
            item.setUserId(userId); item.setAchievementId(definition.getId()); item.setProgress(progress);
            boolean unlocked = unlockedBefore || progress >= definition.getRequirementValue(); item.setUnlocked(unlocked ? 1 : 0);
            if (unlocked && item.getUnlockedAt() == null) item.setUnlockedAt(LocalDateTime.now());
            if (item.getRewardSent() == null) item.setRewardSent(0); item.setVersion(item.getVersion() == null ? 0 : item.getVersion() + 1);
            if (old == null) { try { userAchievementMapper.insert(item); } catch (DuplicateKeyException ignored) { item = findProgress(userId, definition.getId()); } }
            else userAchievementMapper.updateById(item);
            if (!unlockedBefore && unlocked) changed.add(toVO(definition, item, userId));
        }
        return changed;
    }

    public List<AchievementVO> check(Long userId) { return check(userId, "manual", "user", userId); }

    private int measure(Long userId, String type) {
        return switch (type) {
            case "checkin_count" -> Math.toIntExact(checkinMapper.selectCount(new LambdaQueryWrapper<Checkin>().eq(Checkin::getUserId, userId).eq(Checkin::getStatus, "published")));
            case "trip_count" -> Math.toIntExact(tripMapper.selectCount(new LambdaQueryWrapper<com.tuge.domain.entity.Trip>()
                    .eq(com.tuge.domain.entity.Trip::getUserId, userId)
                    .eq(com.tuge.domain.entity.Trip::getValidity, "valid")));
            case "badge_count" -> Math.toIntExact(badgeMapper.selectCount(new LambdaQueryWrapper<UserBadge>().eq(UserBadge::getUserId, userId)));
            case "post_count" -> Math.toIntExact(postMapper.selectCount(new LambdaQueryWrapper<CommunityPost>().eq(CommunityPost::getUserId, userId).in(CommunityPost::getStatus, List.of("published", "featured"))));
            case "expense_sum" -> orderMapper.selectList(new LambdaQueryWrapper<BizOrder>().eq(BizOrder::getUserId, userId).in(BizOrder::getStatus, List.of("paid", "opened"))).stream().mapToInt(o -> o.getPaidCent() == null ? 0 : o.getPaidCent()).sum();
            default -> 0;
        };
    }

    private UserAchievement findProgress(Long userId, Long achievementId) {
        return userAchievementMapper.selectOne(new LambdaQueryWrapper<UserAchievement>().eq(UserAchievement::getUserId, userId).eq(UserAchievement::getAchievementId, achievementId));
    }

    private AchievementVO toVO(Achievement definition, UserAchievement progress, Long userId) {
        AchievementVO vo = new AchievementVO(); vo.setAchievementId(definition.getId()); vo.setCode(definition.getCode()); vo.setName(definition.getName()); vo.setDescription(definition.getDescription()); vo.setIconUrl(definition.getIconUrl()); vo.setRequirementType(definition.getRequirementType()); vo.setRequirementValue(definition.getRequirementValue()); vo.setLevel(definition.getLevel()); vo.setStatus(definition.getStatus()); vo.setVersion(definition.getVersion()); int current = progress == null || progress.getProgress() == null ? 0 : progress.getProgress(); vo.setCurrentProgress(current); int percent = definition.getRequirementValue() == null || definition.getRequirementValue() == 0 ? 0 : Math.min(100, current * 100 / definition.getRequirementValue()); vo.setProgressPercent(percent); boolean unlocked = progress != null && progress.getUnlocked() != null && progress.getUnlocked() == 1; vo.setState(unlocked ? "unlocked" : current > 0 ? "in_progress" : "locked"); vo.setUnlockedAt(progress == null ? null : progress.getUnlockedAt()); return vo;
    }
}
