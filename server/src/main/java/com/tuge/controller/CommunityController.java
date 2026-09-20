package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.CommentCreateRequest;
import com.tuge.domain.dto.PostCreateRequest;
import com.tuge.domain.service.CommunityService;
import com.tuge.domain.vo.CommunityCommentVO;
import com.tuge.domain.vo.CommunityPostVO;
import com.tuge.domain.vo.CreatorVO;
import com.tuge.domain.vo.SocialUserVO;
import com.tuge.domain.vo.TopicVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/community")
public class CommunityController {
    private final CommunityService service;
    public CommunityController(CommunityService service) { this.service = service; }

    @GetMapping("/posts")
    public Result<PageResult<CommunityPostVO>> posts(@RequestParam(required = false) String view, @RequestParam(required = false) Long topicId, @RequestParam(required = false) String locationTag, @RequestParam(defaultValue = "recent") String sort, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.listPosts(JwtContext.getUserId(), view, topicId, locationTag, sort, page, pageSize)); }
    @GetMapping("/posts/{id}")
    public Result<CommunityPostVO> detail(@PathVariable Long id) { return Result.success(service.detail(JwtContext.getUserId(), id)); }
    @PostMapping("/posts")
    public Result<CommunityPostVO> create(@Valid @RequestBody PostCreateRequest request) { return Result.success(service.create(JwtContext.getUserId(), request)); }
    @DeleteMapping("/posts/{id}")
    public Result<CommunityPostVO> delete(@PathVariable Long id) { return Result.success(service.delete(JwtContext.getUserId(), id)); }
    @PutMapping("/posts/{id}/like")
    public Result<CommunityPostVO> like(@PathVariable Long id) { return Result.success(service.setLike(JwtContext.getUserId(), id, true)); }
    @DeleteMapping("/posts/{id}/like")
    public Result<CommunityPostVO> unlike(@PathVariable Long id) { return Result.success(service.setLike(JwtContext.getUserId(), id, false)); }
    @PutMapping("/posts/{id}/collection")
    public Result<CommunityPostVO> collect(@PathVariable Long id) { return Result.success(service.setCollect(JwtContext.getUserId(), id, true)); }
    @DeleteMapping("/posts/{id}/collection")
    public Result<CommunityPostVO> uncollect(@PathVariable Long id) { return Result.success(service.setCollect(JwtContext.getUserId(), id, false)); }
    @PostMapping("/posts/{id}/share")
    public Result<CommunityPostVO> share(@PathVariable Long id) { return Result.success(service.share(JwtContext.getUserId(), id)); }
    @GetMapping("/posts/{id}/comments")
    public Result<PageResult<CommunityCommentVO>> comments(@PathVariable Long id, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "30") long pageSize) { return Result.success(service.comments(JwtContext.getUserId(), id, page, pageSize)); }
    @PostMapping("/posts/{id}/comments")
    public Result<CommunityCommentVO> comment(@PathVariable Long id, @Valid @RequestBody CommentCreateRequest request) { return Result.success(service.createComment(JwtContext.getUserId(), id, request)); }
    @DeleteMapping("/comments/{id}")
    public Result<Void> deleteComment(@PathVariable Long id) { service.deleteComment(JwtContext.getUserId(), id); return Result.success(); }
    @GetMapping("/topics")
    public Result<PageResult<TopicVO>> topics(@RequestParam(required = false) String keyword, @RequestParam(required = false) Boolean followed, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.topics(JwtContext.getUserId(), keyword, followed, page, pageSize)); }
    @PutMapping("/topics/{id}/follow")
    public Result<TopicVO> followTopic(@PathVariable Long id) { return Result.success(service.setTopicFollow(JwtContext.getUserId(), id, true)); }
    @DeleteMapping("/topics/{id}/follow")
    public Result<TopicVO> unfollowTopic(@PathVariable Long id) { return Result.success(service.setTopicFollow(JwtContext.getUserId(), id, false)); }
    @GetMapping("/creators")
    public Result<java.util.List<CreatorVO>> creators(@RequestParam(defaultValue = "influence") String metric, @RequestParam(defaultValue = "all") String period) { return Result.success(service.creators(JwtContext.getUserId(), metric, period)); }
    @PutMapping("/users/{id}/follow")
    public Result<SocialUserVO> followUser(@PathVariable Long id) { return Result.success(service.setUserFollow(JwtContext.getUserId(), id, true)); }
    @DeleteMapping("/users/{id}/follow")
    public Result<SocialUserVO> unfollowUser(@PathVariable Long id) { return Result.success(service.setUserFollow(JwtContext.getUserId(), id, false)); }
    @GetMapping("/me/posts")
    public Result<PageResult<CommunityPostVO>> myPosts(@RequestParam(required = false) String status, @RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.myPosts(JwtContext.getUserId(), status, page, pageSize)); }
    @GetMapping("/me/collections")
    public Result<PageResult<CommunityPostVO>> collections(@RequestParam(defaultValue = "1") long page, @RequestParam(defaultValue = "20") long pageSize) { return Result.success(service.collections(JwtContext.getUserId(), page, pageSize)); }
}
