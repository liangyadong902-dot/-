package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.auth.AdminRoles;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.dto.AchievementUpsertRequest;
import com.tuge.domain.dto.AdminContentStatusRequest;
import com.tuge.domain.dto.TopicUpsertRequest;
import com.tuge.domain.entity.Achievement;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.Checkin;
import com.tuge.domain.entity.CommunityPost;
import com.tuge.domain.entity.PostComment;
import com.tuge.domain.entity.Topic;
import com.tuge.domain.entity.UserAchievement;
import com.tuge.domain.mapper.AchievementMapper;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.CheckinMapper;
import com.tuge.domain.mapper.CommunityPostMapper;
import com.tuge.domain.mapper.PostCommentMapper;
import com.tuge.domain.mapper.TopicMapper;
import com.tuge.domain.mapper.UserAchievementMapper;
import com.tuge.domain.vo.AchievementVO;
import com.tuge.domain.vo.CheckinVO;
import com.tuge.domain.vo.CommunityCommentVO;
import com.tuge.domain.vo.CommunityPostVO;
import com.tuge.domain.vo.TopicVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SocialAdminService {
    private final CommunityPostMapper postMapper;
    private final PostCommentMapper commentMapper;
    private final TopicMapper topicMapper;
    private final CheckinMapper checkinMapper;
    private final AchievementMapper achievementMapper;
    private final UserAchievementMapper userAchievementMapper;
    private final AppUserMapper appUserMapper;
    private final CommunityService communityService;
    private final CheckinService checkinService;
    private final AchievementService achievementService;
    private final AdminAuditService auditService;

    public SocialAdminService(CommunityPostMapper postMapper, PostCommentMapper commentMapper, TopicMapper topicMapper,
                              CheckinMapper checkinMapper, AchievementMapper achievementMapper, CommunityService communityService,
                              CheckinService checkinService, AchievementService achievementService, AdminAuditService auditService,
                              UserAchievementMapper userAchievementMapper, AppUserMapper appUserMapper) {
        this.postMapper = postMapper; this.commentMapper = commentMapper; this.topicMapper = topicMapper; this.checkinMapper = checkinMapper; this.achievementMapper = achievementMapper; this.communityService = communityService; this.checkinService = checkinService; this.achievementService = achievementService; this.auditService = auditService; this.userAchievementMapper = userAchievementMapper; this.appUserMapper = appUserMapper;
    }

    public PageResult<CommunityPostVO> posts(String keyword, Long userId, Long topicId, String status, long page, long size) {
        Page<CommunityPost> result = new Page<>(safe(page), safe(size));
        Page<CommunityPost> rows = postMapper.selectPage(result, new LambdaQueryWrapper<CommunityPost>().like(keyword != null && !keyword.isBlank(), CommunityPost::getTitle, keyword == null ? "" : keyword.trim()).eq(userId != null, CommunityPost::getUserId, userId).eq(topicId != null, CommunityPost::getTopicId, topicId).eq(status != null && !status.isBlank(), CommunityPost::getStatus, status).orderByDesc(CommunityPost::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(p -> communityService.adminView(p.getId())).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public CommunityPostVO postDetail(Long id) { return communityService.adminView(id); }

    @Transactional
    public CommunityPostVO updatePostStatus(Long id, AdminContentStatusRequest request) {
        AdminRoles.requireContentWrite(); CommunityPost post = postMapper.selectById(id); if (post == null) throw new BusinessException(404, "帖子不存在"); if (request.version() != null && !request.version().equals(post.getVersion())) throw new BusinessException(409, "帖子已被其他管理员更新"); if (!List.of("published", "featured", "down", "deleted").contains(request.toStatus())) throw new BusinessException(400, "不支持的帖子状态"); String before = post.getStatus(); post.setStatus(request.toStatus()); post.setReviewReason(request.reason()); post.setReviewedBy(com.tuge.common.jwt.JwtContext.getUserId()); post.setVersion(post.getVersion() == null ? 1 : post.getVersion() + 1); postMapper.updateById(post); auditService.record("community.post.status", "community_post", id, Map.of("before", before, "after", request.toStatus(), "reason", request.reason() == null ? "" : request.reason())); return communityService.adminView(id);
    }

    public PageResult<CommunityCommentVO> comments(Long postId, Long userId, String status, long page, long size) {
        Page<PostComment> result = new Page<>(safe(page), safe(size)); Page<PostComment> rows = commentMapper.selectPage(result, new LambdaQueryWrapper<PostComment>().eq(postId != null, PostComment::getPostId, postId).eq(userId != null, PostComment::getUserId, userId).eq(status != null && !status.isBlank(), PostComment::getStatus, status).orderByDesc(PostComment::getCreatedAt)); return PageResult.of(rows.getRecords().stream().map(communityService::adminCommentView).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public void updateCommentStatus(Long id, AdminContentStatusRequest request) { AdminRoles.requireContentWrite(); PostComment comment = commentMapper.selectById(id); if (comment == null) throw new BusinessException(404, "评论不存在"); if (request.version() != null && !request.version().equals(comment.getVersion())) throw new BusinessException(409, "评论已被其他管理员更新"); if (!List.of("published", "hidden", "deleted").contains(request.toStatus())) throw new BusinessException(400, "不支持的评论状态"); String before = comment.getStatus(); comment.setStatus(request.toStatus()); comment.setReviewReason(request.reason()); comment.setReviewedBy(com.tuge.common.jwt.JwtContext.getUserId()); comment.setVersion(comment.getVersion() == null ? 1 : comment.getVersion() + 1); commentMapper.updateById(comment); auditService.record("community.comment.status", "post_comment", id, Map.of("before", before, "after", request.toStatus(), "reason", request.reason() == null ? "" : request.reason())); }

    public PageResult<TopicVO> topics(String keyword, String status, long page, long size) { Page<Topic> result = new Page<>(safe(page), safe(size)); Page<Topic> rows = topicMapper.selectPage(result, new LambdaQueryWrapper<Topic>().like(keyword != null && !keyword.isBlank(), Topic::getName, keyword == null ? "" : keyword.trim()).eq(status != null && !status.isBlank(), Topic::getStatus, status).orderByDesc(Topic::getSortWeight).orderByAsc(Topic::getId)); return PageResult.of(rows.getRecords().stream().map(this::topic).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize()); }

    @Transactional
    public TopicVO createTopic(TopicUpsertRequest request) { AdminRoles.requireContentWrite(); Topic item = new Topic(); apply(item, request); item.setVersion(0); topicMapper.insert(item); auditService.record("community.topic.create", "topic", item.getId(), Map.of("name", item.getName(), "status", item.getStatus())); return topic(item); }
    @Transactional
    public TopicVO updateTopic(Long id, TopicUpsertRequest request) { AdminRoles.requireContentWrite(); Topic item = topicMapper.selectById(id); if (item == null) throw new BusinessException(404, "话题不存在"); if (request.version() != null && !request.version().equals(item.getVersion())) throw new BusinessException(409, "话题已被其他管理员更新"); String before = item.getName() + ":" + item.getStatus(); apply(item, request); item.setVersion(item.getVersion() == null ? 1 : item.getVersion() + 1); topicMapper.updateById(item); auditService.record("community.topic.update", "topic", id, Map.of("before", before, "after", item.getName() + ":" + item.getStatus())); return topic(item); }
    @Transactional
    public void deleteTopic(Long id) { AdminRoles.requireContentWrite(); Topic item = topicMapper.selectById(id); if (item == null) throw new BusinessException(404, "话题不存在"); if (item.getPostCount() != null && item.getPostCount() > 0) throw new BusinessException(409, "话题已有帖子引用，请停用"); topicMapper.deleteById(id); auditService.record("community.topic.delete", "topic", id, Map.of("name", item.getName())); }

    public PageResult<CheckinVO> checkins(Long userId, String status, long page, long size) { Page<Checkin> result = new Page<>(safe(page), safe(size)); Page<Checkin> rows = checkinMapper.selectPage(result, new LambdaQueryWrapper<Checkin>().eq(userId != null, Checkin::getUserId, userId).eq(status != null && !status.isBlank(), Checkin::getStatus, status).orderByDesc(Checkin::getCreatedAt)); return PageResult.of(rows.getRecords().stream().map(c -> checkinService.adminView(c.getId())).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize()); }
    public CheckinVO checkinDetail(Long id) { return checkinService.adminView(id); }
    @Transactional
    public CheckinVO updateCheckinStatus(Long id, AdminContentStatusRequest request) { AdminRoles.requireContentWrite(); Checkin item = checkinMapper.selectById(id); if (item == null) throw new BusinessException(404, "打卡不存在"); if (request.version() != null && !request.version().equals(item.getVersion())) throw new BusinessException(409, "打卡已被其他管理员更新"); if (!List.of("published", "hidden").contains(request.toStatus())) throw new BusinessException(400, "不支持的打卡状态"); String before = item.getStatus(); item.setStatus(request.toStatus()); item.setVersion(item.getVersion() == null ? 1 : item.getVersion() + 1); checkinMapper.updateById(item); auditService.record("checkin.status", "checkin", id, Map.of("before", before, "after", request.toStatus(), "reason", request.reason() == null ? "" : request.reason())); return checkinService.adminView(id); }

    public Map<String, Object> checkinStatistics() {
        List<Checkin> rows = checkinMapper.selectList(new LambdaQueryWrapper<Checkin>().eq(Checkin::getStatus, "published"));
        LocalDateTime since = LocalDate.now().minusDays(29).atStartOfDay();
        long activeUsers = rows.stream().filter(row -> row.getCreatedAt() != null && !row.getCreatedAt().isBefore(since)).map(Checkin::getUserId).distinct().count();
        Map<Long, LocalDateTime> firstByUser = rows.stream().filter(row -> row.getCreatedAt() != null).collect(Collectors.toMap(Checkin::getUserId, Checkin::getCreatedAt, (left, right) -> left.isBefore(right) ? left : right));
        long newUsers = firstByUser.values().stream().filter(time -> !time.isBefore(since)).count();
        Map<String, Long> locations = rows.stream().collect(Collectors.groupingBy(Checkin::getLocationName, Collectors.counting()));
        List<Map<String, Object>> topLocations = locations.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed()).limit(10)
                .map(entry -> Map.<String, Object>of("locationName", entry.getKey(), "count", entry.getValue())).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", rows.size());
        result.put("newUsers", newUsers);
        result.put("activeUsers", activeUsers);
        result.put("topLocations", topLocations);
        result.put("dailyTrend", dailyCheckinTrend(rows));
        return result;
    }

    public PageResult<AchievementVO> achievements(String status, long page, long size) { Page<Achievement> result = new Page<>(safe(page), safe(size)); Page<Achievement> rows = achievementMapper.selectPage(result, new LambdaQueryWrapper<Achievement>().eq(status != null && !status.isBlank(), Achievement::getStatus, status).orderByDesc(Achievement::getSortWeight).orderByAsc(Achievement::getId)); return PageResult.of(rows.getRecords().stream().map(achievementService::definition).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize()); }
    @Transactional
    public AchievementVO createAchievement(AchievementUpsertRequest request) { AdminRoles.requireContentWrite(); Achievement item = new Achievement(); apply(item, request); item.setVersion(0); achievementMapper.insert(item); auditService.record("achievement.create", "achievement", item.getId(), Map.of("code", item.getCode(), "status", item.getStatus())); return achievementService.definition(item); }
    @Transactional
    public AchievementVO updateAchievement(Long id, AchievementUpsertRequest request) { AdminRoles.requireContentWrite(); Achievement item = achievementMapper.selectById(id); if (item == null) throw new BusinessException(404, "成就不存在"); if (request.version() != null && !request.version().equals(item.getVersion())) throw new BusinessException(409, "成就已被其他管理员更新"); String before = item.getCode() + ":" + item.getStatus(); apply(item, request); item.setVersion(item.getVersion() == null ? 1 : item.getVersion() + 1); achievementMapper.updateById(item); auditService.record("achievement.update", "achievement", id, Map.of("before", before, "after", item.getCode() + ":" + item.getStatus())); return achievementService.definition(item); }
    @Transactional
    public void deleteAchievement(Long id) { AdminRoles.requireContentWrite(); Achievement item = achievementMapper.selectById(id); if (item == null) throw new BusinessException(404, "成就不存在"); item.setStatus("off"); item.setVersion(item.getVersion() == null ? 1 : item.getVersion() + 1); achievementMapper.updateById(item); auditService.record("achievement.disable", "achievement", id, Map.of("code", item.getCode())); }

    public Map<String, Object> achievementStatistics() {
        List<Achievement> definitions = achievementMapper.selectList(new LambdaQueryWrapper<Achievement>());
        List<UserAchievement> rows = userAchievementMapper.selectList(new LambdaQueryWrapper<UserAchievement>());
        List<UserAchievement> unlocked = rows.stream().filter(row -> row.getUnlocked() != null && row.getUnlocked() == 1).toList();
        long userTotal = appUserMapper.selectCount(new LambdaQueryWrapper<AppUser>().eq(AppUser::getStatus, "normal"));
        Map<Long, Long> byId = unlocked.stream().collect(Collectors.groupingBy(UserAchievement::getAchievementId, Collectors.counting()));
        List<Map<String, Object>> byAchievement = definitions.stream().map(definition -> {
            long count = byId.getOrDefault(definition.getId(), 0L);
            double rate = userTotal == 0 ? 0D : count * 100D / userTotal;
            return Map.<String, Object>of("achievementId", definition.getId(), "name", definition.getName(), "unlockCount", count, "unlockRate", rate);
        }).toList();
        double unlockRate = userTotal == 0 || definitions.isEmpty() ? 0D : unlocked.size() * 100D / (userTotal * definitions.size());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("unlockTotal", unlocked.size());
        result.put("userTotal", userTotal);
        result.put("unlockRate", unlockRate);
        result.put("byAchievement", byAchievement);
        result.put("dailyTrend", dailyAchievementTrend(unlocked));
        return result;
    }

    private void apply(Topic item, TopicUpsertRequest request) { item.setName(request.name().trim()); item.setCoverUrl(request.coverUrl()); item.setDescription(request.description()); item.setHeatWeight(request.heatWeight() == null ? 0 : request.heatWeight()); item.setSortWeight(request.sortWeight() == null ? 0 : request.sortWeight()); item.setStatus(request.status() == null ? "on" : request.status()); }
    private TopicVO topic(Topic t) { TopicVO v = new TopicVO(); v.setTopicId(t.getId()); v.setName(t.getName()); v.setCoverUrl(t.getCoverUrl()); v.setDescription(t.getDescription()); v.setPostCount(t.getPostCount()); v.setFollowCount(t.getFollowCount()); v.setStatus(t.getStatus()); v.setVersion(t.getVersion()); return v; }
    private void apply(Achievement item, AchievementUpsertRequest r) { item.setCode(r.code().trim()); item.setName(r.name().trim()); item.setDescription(r.description()); item.setIconUrl(r.iconUrl()); item.setRequirementType(r.requirementType()); item.setRequirementValue(r.requirementValue()); item.setLevel(r.level() == null ? 1 : r.level()); item.setSortWeight(r.sortWeight() == null ? 0 : r.sortWeight()); item.setStatus(r.status() == null ? "on" : r.status()); }

    private List<Map<String, Object>> dailyCheckinTrend(List<Checkin> rows) {
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate date = LocalDate.now().minusDays(offset);
            long count = rows.stream().filter(row -> row.getCreatedAt() != null && row.getCreatedAt().toLocalDate().equals(date)).count();
            trend.add(Map.of("date", date.toString(), "count", count));
        }
        return trend;
    }

    private List<Map<String, Object>> dailyAchievementTrend(List<UserAchievement> rows) {
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate date = LocalDate.now().minusDays(offset);
            long count = rows.stream().filter(row -> row.getUnlockedAt() != null && row.getUnlockedAt().toLocalDate().equals(date)).count();
            trend.add(Map.of("date", date.toString(), "count", count));
        }
        return trend;
    }
    private long safe(long value) { return Math.min(100, Math.max(1, value)); }
}
