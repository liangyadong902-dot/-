package com.tuge.controller.admin;

import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.AchievementUpsertRequest;
import com.tuge.domain.dto.AdminContentStatusRequest;
import com.tuge.domain.dto.TopicUpsertRequest;
import com.tuge.domain.service.SocialAdminService;
import com.tuge.domain.vo.AchievementVO;
import com.tuge.domain.vo.CheckinVO;
import com.tuge.domain.vo.CommunityCommentVO;
import com.tuge.domain.vo.CommunityPostVO;
import com.tuge.domain.vo.TopicVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class SocialAdminController {
    private final SocialAdminService service;
    public SocialAdminController(SocialAdminService service) { this.service = service; }
    @GetMapping("/community/posts") public Result<PageResult<CommunityPostVO>> posts(@RequestParam(required = false) String keyword, @RequestParam(required = false) Long userId, @RequestParam(required = false) Long topicId, @RequestParam(required = false) String status, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.posts(keyword, userId, topicId, status, page, pageSize)); }
    @GetMapping("/community/posts/{id}") public Result<CommunityPostVO> post(@PathVariable Long id) { return Result.success(service.postDetail(id)); }
    @PatchMapping("/community/posts/{id}/status") public Result<CommunityPostVO> postStatus(@PathVariable Long id, @Valid @RequestBody AdminContentStatusRequest request) { return Result.success(service.updatePostStatus(id, request)); }
    @GetMapping("/community/comments") public Result<PageResult<CommunityCommentVO>> comments(@RequestParam(required = false) Long postId, @RequestParam(required = false) Long userId, @RequestParam(required = false) String status, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.comments(postId, userId, status, page, pageSize)); }
    @PatchMapping("/community/comments/{id}/status") public Result<Void> commentStatus(@PathVariable Long id, @Valid @RequestBody AdminContentStatusRequest request) { service.updateCommentStatus(id, request); return Result.success(); }
    @GetMapping("/community/topics") public Result<PageResult<TopicVO>> topics(@RequestParam(required = false) String keyword, @RequestParam(required = false) String status, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.topics(keyword, status, page, pageSize)); }
    @PostMapping("/community/topics") public Result<TopicVO> createTopic(@Valid @RequestBody TopicUpsertRequest request) { return Result.success(service.createTopic(request)); }
    @PutMapping("/community/topics/{id}") public Result<TopicVO> updateTopic(@PathVariable Long id, @Valid @RequestBody TopicUpsertRequest request) { return Result.success(service.updateTopic(id, request)); }
    @DeleteMapping("/community/topics/{id}") public Result<Void> deleteTopic(@PathVariable Long id) { service.deleteTopic(id); return Result.success(); }
    @GetMapping("/checkins") public Result<PageResult<CheckinVO>> checkins(@RequestParam(required = false) Long userId, @RequestParam(required = false) String status, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.checkins(userId, status, page, pageSize)); }
    @GetMapping("/checkins/statistics") public Result<Map<String, Object>> checkinStatistics() { return Result.success(service.checkinStatistics()); }
    @GetMapping("/checkins/{id}") public Result<CheckinVO> checkin(@PathVariable Long id) { return Result.success(service.checkinDetail(id)); }
    @PatchMapping("/checkins/{id}/status") public Result<CheckinVO> checkinStatus(@PathVariable Long id, @Valid @RequestBody AdminContentStatusRequest request) { return Result.success(service.updateCheckinStatus(id, request)); }
    @GetMapping("/achievements") public Result<PageResult<AchievementVO>> achievements(@RequestParam(required = false) String status, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.achievements(status, page, pageSize)); }
    @GetMapping("/achievements/statistics") public Result<Map<String, Object>> achievementStatistics() { return Result.success(service.achievementStatistics()); }
    @PostMapping("/achievements") public Result<AchievementVO> createAchievement(@Valid @RequestBody AchievementUpsertRequest request) { return Result.success(service.createAchievement(request)); }
    @PutMapping("/achievements/{id}") public Result<AchievementVO> updateAchievement(@PathVariable Long id, @Valid @RequestBody AchievementUpsertRequest request) { return Result.success(service.updateAchievement(id, request)); }
    @DeleteMapping("/achievements/{id}") public Result<Void> deleteAchievement(@PathVariable Long id) { service.deleteAchievement(id); return Result.success(); }
}
