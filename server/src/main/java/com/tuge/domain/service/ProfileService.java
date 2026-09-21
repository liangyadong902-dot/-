package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.CommunityPost;
import com.tuge.domain.entity.UserFollow;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.CommunityPostMapper;
import com.tuge.domain.mapper.UserFollowMapper;
import com.tuge.domain.vo.CommunityPostVO;
import com.tuge.domain.vo.UserProfileVO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

/**
 * 用户公开主页：资料 + 作品
 */
@Service
public class ProfileService {

    private final AppUserMapper userMapper;
    private final CommunityPostMapper postMapper;
    private final UserFollowMapper followMapper;
    private final CommunityService communityService;

    public ProfileService(AppUserMapper userMapper, CommunityPostMapper postMapper, UserFollowMapper followMapper,
                          CommunityService communityService) {
        this.userMapper = userMapper;
        this.postMapper = postMapper;
        this.followMapper = followMapper;
        this.communityService = communityService;
    }

    public UserProfileVO profile(Long viewerId, Long targetId) {
        AppUser user = userMapper.selectById(targetId);
        if (user == null) throw new BusinessException(404, "用户不存在");
        boolean self = Objects.equals(viewerId, targetId);
        UserProfileVO vo = new UserProfileVO();
        vo.setUserId(user.getId()); vo.setNickname(user.getNickname()); vo.setAvatarUrl(user.getAvatarUrl());
        vo.setCity(user.getCity()); vo.setGender(user.getGender()); vo.setJoinedAt(user.getCreatedAt());
        vo.setPostCount(postMapper.selectCount(new LambdaQueryWrapper<CommunityPost>()
                .eq(CommunityPost::getUserId, targetId).in(CommunityPost::getStatus, List.of("published", "featured"))));
        vo.setFollowerCount(followMapper.selectCount(new LambdaQueryWrapper<UserFollow>().eq(UserFollow::getFollowedUserId, targetId)));
        vo.setFollowingCount(followMapper.selectCount(new LambdaQueryWrapper<UserFollow>().eq(UserFollow::getFollowerUserId, targetId)));
        vo.setLikeReceivedCount(postMapper.selectList(new LambdaQueryWrapper<CommunityPost>()
                        .eq(CommunityPost::getUserId, targetId).in(CommunityPost::getStatus, List.of("published", "featured")))
                .stream().mapToLong(p -> p.getLikeCount() == null ? 0 : p.getLikeCount()).sum());
        vo.setFollowed(!self && viewerId != null && followMapper.selectCount(new LambdaQueryWrapper<UserFollow>()
                .eq(UserFollow::getFollowerUserId, viewerId).eq(UserFollow::getFollowedUserId, targetId)) > 0);
        vo.setSelf(self);
        return vo;
    }

    /** 某用户的公开作品（已发布 / 精选帖子） */
    public PageResult<CommunityPostVO> posts(Long viewerId, Long targetId, long page, long pageSize) {
        AppUser user = userMapper.selectById(targetId);
        if (user == null) throw new BusinessException(404, "用户不存在");
        Page<CommunityPost> target = new Page<>(Math.max(page, 1), Math.min(Math.max(pageSize, 1), 50));
        Page<CommunityPost> rows = postMapper.selectPage(target, new LambdaQueryWrapper<CommunityPost>()
                .eq(CommunityPost::getUserId, targetId)
                .in(CommunityPost::getStatus, List.of("published", "featured"))
                .orderByDesc(CommunityPost::getCreatedAt).orderByDesc(CommunityPost::getId));
        return PageResult.of(rows.getRecords().stream().map(p -> communityService.toPostForProfile(p, viewerId)).toList(),
                rows.getTotal(), rows.getCurrent(), rows.getSize());
    }
}
