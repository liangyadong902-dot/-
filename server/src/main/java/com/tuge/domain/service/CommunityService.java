package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.dto.CommentCreateRequest;
import com.tuge.domain.dto.PostCreateRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.Checkin;
import com.tuge.domain.entity.CommunityPost;
import com.tuge.domain.entity.PostCollect;
import com.tuge.domain.entity.PostComment;
import com.tuge.domain.entity.PostImage;
import com.tuge.domain.entity.PostLike;
import com.tuge.domain.entity.Topic;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.entity.UserFollow;
import com.tuge.domain.entity.UserTopicFollow;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.CheckinMapper;
import com.tuge.domain.mapper.CommunityPostMapper;
import com.tuge.domain.mapper.PostCollectMapper;
import com.tuge.domain.mapper.PostCommentMapper;
import com.tuge.domain.mapper.PostImageMapper;
import com.tuge.domain.mapper.PostLikeMapper;
import com.tuge.domain.mapper.TopicMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.UserFollowMapper;
import com.tuge.domain.mapper.UserTopicFollowMapper;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.vo.CommunityCommentVO;
import com.tuge.domain.vo.CommunityPostVO;
import com.tuge.domain.vo.CreatorVO;
import com.tuge.domain.vo.LinkedContentVO;
import com.tuge.domain.vo.SocialUserVO;
import com.tuge.domain.vo.TopicVO;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class CommunityService {
    private final CommunityPostMapper postMapper;
    private final PostImageMapper imageMapper;
    private final PostCommentMapper commentMapper;
    private final PostLikeMapper likeMapper;
    private final PostCollectMapper collectMapper;
    private final TopicMapper topicMapper;
    private final UserTopicFollowMapper topicFollowMapper;
    private final UserFollowMapper followMapper;
    private final AppUserMapper userMapper;
    private final BlindBoxMapper boxMapper;
    private final TripMapper tripMapper;
    private final CheckinMapper checkinMapper;

    public CommunityService(CommunityPostMapper postMapper, PostImageMapper imageMapper,
                            PostCommentMapper commentMapper, PostLikeMapper likeMapper,
                            PostCollectMapper collectMapper, TopicMapper topicMapper,
                            UserTopicFollowMapper topicFollowMapper, UserFollowMapper followMapper,
                            AppUserMapper userMapper, BlindBoxMapper boxMapper,
                            TripMapper tripMapper, CheckinMapper checkinMapper) {
        this.postMapper = postMapper;
        this.imageMapper = imageMapper;
        this.commentMapper = commentMapper;
        this.likeMapper = likeMapper;
        this.collectMapper = collectMapper;
        this.topicMapper = topicMapper;
        this.topicFollowMapper = topicFollowMapper;
        this.followMapper = followMapper;
        this.userMapper = userMapper;
        this.boxMapper = boxMapper;
        this.tripMapper = tripMapper;
        this.checkinMapper = checkinMapper;
    }

    public PageResult<CommunityPostVO> listPosts(Long userId, String view, Long topicId,
                                                 String locationTag, String sort, long page, long pageSize) {
        Page<CommunityPost> target = new Page<>(safePage(page), safeSize(pageSize));
        LambdaQueryWrapper<CommunityPost> query = new LambdaQueryWrapper<CommunityPost>()
                .in(CommunityPost::getStatus, List.of("published", "featured"))
                .eq(topicId != null, CommunityPost::getTopicId, topicId)
                .like(locationTag != null && !locationTag.isBlank(), CommunityPost::getLocationName,
                        locationTag == null ? "" : locationTag.trim());
        if ("following".equals(view)) {
            if (userId == null) return PageResult.of(List.of(), 0, safePage(page), safeSize(pageSize));
            List<Long> followed = followMapper.selectList(new LambdaQueryWrapper<UserFollow>()
                    .eq(UserFollow::getFollowerUserId, userId)).stream().map(UserFollow::getFollowedUserId).toList();
            if (followed.isEmpty()) return PageResult.of(List.of(), 0, safePage(page), safeSize(pageSize));
            query.in(CommunityPost::getUserId, followed);
        }
        if ("popular".equals(sort)) query.orderByDesc(CommunityPost::getLikeCount)
                .orderByDesc(CommunityPost::getCreatedAt);
        else query.orderByDesc(CommunityPost::getCreatedAt).orderByDesc(CommunityPost::getId);
        Page<CommunityPost> rows = postMapper.selectPage(target, query);
        return PageResult.of(rows.getRecords().stream().map(p -> toPost(p, userId, false)).toList(),
                rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public PageResult<CommunityPostVO> relatedPosts(Long boxId, long page, long pageSize) {
        Page<CommunityPost> target = new Page<>(safePage(page), safeSize(pageSize));
        Page<CommunityPost> rows = postMapper.selectPage(target, new LambdaQueryWrapper<CommunityPost>()
                .eq(CommunityPost::getLinkedBlindBoxId, boxId)
                .in(CommunityPost::getStatus, List.of("published", "featured"))
                .orderByDesc(CommunityPost::getCreatedAt)
                .orderByDesc(CommunityPost::getId));
        return PageResult.of(rows.getRecords().stream().map(post -> toPost(post, null, false)).toList(),
                rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public CommunityPostVO detail(Long userId, Long postId) {
        CommunityPost post = findPost(postId);
        if (!isPublic(post) && !Objects.equals(post.getUserId(), userId)) throw new BusinessException(404, "帖子不存在");
        return toPost(post, userId, true);
    }

    public CommunityPostVO adminView(Long postId) {
        return toPost(findPost(postId), null, true);
    }

    public CommunityCommentVO adminCommentView(PostComment comment) {
        return toComment(comment);
    }

    @Transactional
    public CommunityPostVO create(Long userId, PostCreateRequest request) {
        requireUser(userId);
        if (request.imageUrls() != null && request.imageUrls().size() > 9) throw new BusinessException(400, "最多上传9张图片");
        if (request.topicId() != null) {
            Topic topic = topicMapper.selectById(request.topicId());
            if (topic == null || !"on".equals(topic.getStatus())) throw new BusinessException(409, "话题不可用");
        }
        Trip trip = request.linkedTripId() == null ? null : tripMapper.selectById(request.linkedTripId());
        if (trip != null && !Objects.equals(trip.getUserId(), userId)) throw new BusinessException(403, "不能关联其他用户的行程");
        Checkin checkin = request.linkedCheckinId() == null ? null : checkinMapper.selectById(request.linkedCheckinId());
        if (checkin != null && !Objects.equals(checkin.getUserId(), userId)) throw new BusinessException(403, "不能关联其他用户的打卡");
        if (checkin != null && trip != null && !Objects.equals(checkin.getTripId(), trip.getId())) throw new BusinessException(409, "关联打卡与行程不一致");
        CommunityPost post = new CommunityPost();
        post.setUserId(userId); post.setTitle(request.title().trim()); post.setContent(request.content().trim());
        post.setTopicId(request.topicId()); post.setLocationName(blankToNull(request.locationName()));
        post.setPublicLocation(Boolean.TRUE.equals(request.publicLocation()) ? 1 : 0);
        post.setLatitude(request.latitude()); post.setLongitude(request.longitude());
        post.setLinkedBlindBoxId(request.linkedBoxId()); post.setLinkedTripId(request.linkedTripId()); post.setLinkedCheckinId(request.linkedCheckinId());
        post.setStatus("review"); post.setLikeCount(0); post.setCollectCount(0); post.setCommentCount(0); post.setShareCount(0); post.setVersion(0);
        postMapper.insert(post);
        if (request.imageUrls() != null) {
            for (int i = 0; i < request.imageUrls().size(); i++) {
                PostImage image = new PostImage(); image.setPostId(post.getId()); image.setUrl(request.imageUrls().get(i)); image.setSortOrder(i); imageMapper.insert(image);
            }
        }
        return toPost(post, userId, true);
    }

    @Transactional
    public CommunityPostVO delete(Long userId, Long postId) {
        CommunityPost post = findPost(postId);
        if (!Objects.equals(post.getUserId(), userId)) throw new BusinessException(403, "只能删除自己的帖子");
        post.setStatus("deleted"); post.setVersion((post.getVersion() == null ? 0 : post.getVersion()) + 1); postMapper.updateById(post);
        return toPost(post, userId, true);
    }

    @Transactional
    public CommunityPostVO setLike(Long userId, Long postId, boolean active) {
        requireUser(userId); CommunityPost post = findPublicPost(postId);
        PostLike existing = likeMapper.selectOne(new LambdaQueryWrapper<PostLike>().eq(PostLike::getPostId, postId).eq(PostLike::getUserId, userId));
        if (active && existing == null) { PostLike like = new PostLike(); like.setPostId(postId); like.setUserId(userId); like.setCreatedAt(LocalDateTime.now()); try { likeMapper.insert(like); } catch (DuplicateKeyException ignored) {} }
        if (!active && existing != null) likeMapper.delete(new LambdaQueryWrapper<PostLike>().eq(PostLike::getPostId, postId).eq(PostLike::getUserId, userId));
        int count = Math.toIntExact(likeMapper.selectCount(new LambdaQueryWrapper<PostLike>().eq(PostLike::getPostId, postId)));
        post.setLikeCount(count); postMapper.updateById(post); return toPost(post, userId, false);
    }

    @Transactional
    public CommunityPostVO setCollect(Long userId, Long postId, boolean active) {
        requireUser(userId); CommunityPost post = findPublicPost(postId);
        PostCollect existing = collectMapper.selectOne(new LambdaQueryWrapper<PostCollect>().eq(PostCollect::getPostId, postId).eq(PostCollect::getUserId, userId));
        if (active && existing == null) { PostCollect item = new PostCollect(); item.setPostId(postId); item.setUserId(userId); item.setCreatedAt(LocalDateTime.now()); try { collectMapper.insert(item); } catch (DuplicateKeyException ignored) {} }
        if (!active && existing != null) collectMapper.delete(new LambdaQueryWrapper<PostCollect>().eq(PostCollect::getPostId, postId).eq(PostCollect::getUserId, userId));
        int count = Math.toIntExact(collectMapper.selectCount(new LambdaQueryWrapper<PostCollect>().eq(PostCollect::getPostId, postId)));
        post.setCollectCount(count); postMapper.updateById(post); return toPost(post, userId, false);
    }

    @Transactional
    public CommunityPostVO share(Long userId, Long postId) {
        requireUser(userId);
        CommunityPost post = findPublicPost(postId);
        postMapper.update(null, new LambdaUpdateWrapper<CommunityPost>().eq(CommunityPost::getId, postId).setSql("share_count = share_count + 1"));
        post.setShareCount((post.getShareCount() == null ? 0 : post.getShareCount()) + 1); return toPost(post, userId, false);
    }

    public PageResult<CommunityCommentVO> comments(Long userId, Long postId, long page, long pageSize) {
        findPublicPost(postId);
        Page<PostComment> result = new Page<>(safePage(page), safeSize(pageSize));
        Page<PostComment> rows = commentMapper.selectPage(result, new LambdaQueryWrapper<PostComment>().eq(PostComment::getPostId, postId).eq(PostComment::getStatus, "published").orderByAsc(PostComment::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(this::toComment).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public CommunityCommentVO createComment(Long userId, Long postId, CommentCreateRequest request) {
        requireUser(userId); CommunityPost post = findPublicPost(postId);
        if (request.parentCommentId() != null) {
            PostComment parent = commentMapper.selectById(request.parentCommentId());
            if (parent == null || !Objects.equals(parent.getPostId(), postId) || !"published".equals(parent.getStatus())) throw new BusinessException(409, "回复目标不可用");
        }
        PostComment comment = new PostComment(); comment.setPostId(postId); comment.setUserId(userId); comment.setParentId(request.parentCommentId()); comment.setReplyToUserId(request.replyToUserId()); comment.setContent(request.content().trim()); comment.setStatus("published"); comment.setVersion(0); commentMapper.insert(comment);
        int count = Math.toIntExact(commentMapper.selectCount(new LambdaQueryWrapper<PostComment>().eq(PostComment::getPostId, postId).eq(PostComment::getStatus, "published")));
        post.setCommentCount(count); postMapper.updateById(post); return toComment(comment);
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        PostComment comment = commentMapper.selectById(commentId); if (comment == null) throw new BusinessException(404, "评论不存在");
        if (!Objects.equals(comment.getUserId(), userId)) throw new BusinessException(403, "只能删除自己的评论");
        comment.setStatus("deleted"); commentMapper.updateById(comment);
        CommunityPost post = findPost(comment.getPostId()); post.setCommentCount(Math.toIntExact(commentMapper.selectCount(new LambdaQueryWrapper<PostComment>().eq(PostComment::getPostId, post.getId()).eq(PostComment::getStatus, "published")))); postMapper.updateById(post);
    }

    public PageResult<TopicVO> topics(Long userId, String keyword, Boolean followed, long page, long pageSize) {
        Page<Topic> result = new Page<>(safePage(page), safeSize(pageSize));
        LambdaQueryWrapper<Topic> query = new LambdaQueryWrapper<Topic>().eq(Topic::getStatus, "on").like(keyword != null && !keyword.isBlank(), Topic::getName, keyword == null ? "" : keyword.trim()).orderByDesc(Topic::getSortWeight).orderByAsc(Topic::getId);
        Page<Topic> rows = topicMapper.selectPage(result, query);
        List<TopicVO> list = rows.getRecords().stream().map(t -> toTopic(t, userId)).filter(t -> !Boolean.TRUE.equals(followed) || t.isFollowed()).toList();
        return PageResult.of(list, Boolean.TRUE.equals(followed) ? list.size() : rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public TopicVO setTopicFollow(Long userId, Long topicId, boolean active) {
        requireUser(userId); Topic topic = topicMapper.selectById(topicId); if (topic == null || !"on".equals(topic.getStatus())) throw new BusinessException(404, "话题不存在");
        UserTopicFollow existing = topicFollowMapper.selectOne(new LambdaQueryWrapper<UserTopicFollow>().eq(UserTopicFollow::getUserId, userId).eq(UserTopicFollow::getTopicId, topicId));
        if (active && existing == null) { UserTopicFollow f = new UserTopicFollow(); f.setUserId(userId); f.setTopicId(topicId); f.setCreatedAt(LocalDateTime.now()); try { topicFollowMapper.insert(f); } catch (DuplicateKeyException ignored) {} }
        if (!active && existing != null) topicFollowMapper.deleteById(existing.getId());
        topic.setFollowCount(Math.toIntExact(topicFollowMapper.selectCount(new LambdaQueryWrapper<UserTopicFollow>().eq(UserTopicFollow::getTopicId, topicId)))); topicMapper.updateById(topic); return toTopic(topic, userId);
    }

    @Transactional
    public SocialUserVO setUserFollow(Long userId, Long targetId, boolean active) {
        requireUser(userId); if (Objects.equals(userId, targetId)) throw new BusinessException(400, "不能关注自己");
        AppUser target = userMapper.selectById(targetId); if (target == null || !"normal".equals(target.getStatus())) throw new BusinessException(404, "用户不存在");
        UserFollow existing = followMapper.selectOne(new LambdaQueryWrapper<UserFollow>().eq(UserFollow::getFollowerUserId, userId).eq(UserFollow::getFollowedUserId, targetId));
        if (active && existing == null) { UserFollow f = new UserFollow(); f.setFollowerUserId(userId); f.setFollowedUserId(targetId); f.setCreatedAt(LocalDateTime.now()); try { followMapper.insert(f); } catch (DuplicateKeyException ignored) {} }
        if (!active && existing != null) followMapper.deleteById(existing.getId()); return socialUser(target, userId);
    }

    public PageResult<CommunityPostVO> myPosts(Long userId, String status, long page, long pageSize) {
        requireUser(userId);
        Page<CommunityPost> result = new Page<>(safePage(page), safeSize(pageSize));
        Page<CommunityPost> rows = postMapper.selectPage(result, new LambdaQueryWrapper<CommunityPost>().eq(CommunityPost::getUserId, userId).eq(status != null && !status.isBlank(), CommunityPost::getStatus, status).orderByDesc(CommunityPost::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(p -> toPost(p, userId, true)).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public PageResult<CommunityPostVO> collections(Long userId, long page, long pageSize) {
        requireUser(userId);
        List<Long> ids = collectMapper.selectList(new LambdaQueryWrapper<PostCollect>().eq(PostCollect::getUserId, userId).orderByDesc(PostCollect::getCreatedAt)).stream().map(PostCollect::getPostId).toList();
        List<CommunityPostVO> list = ids.stream().map(postMapper::selectById).filter(Objects::nonNull).filter(this::isPublic).map(p -> toPost(p, userId, false)).toList();
        return PageResult.of(slice(list, page, pageSize), list.size(), safePage(page), safeSize(pageSize));
    }

    public List<CreatorVO> creators(Long userId, String metric, String period) {
        List<AppUser> users = userMapper.selectList(new LambdaQueryWrapper<AppUser>().eq(AppUser::getStatus, "normal"));
        List<CreatorVO> result = new ArrayList<>();
        for (AppUser user : users) {
            long posts = postMapper.selectCount(new LambdaQueryWrapper<CommunityPost>().eq(CommunityPost::getUserId, user.getId()).in(CommunityPost::getStatus, List.of("published", "featured")));
            long checkins = checkinMapper.selectCount(new LambdaQueryWrapper<Checkin>().eq(Checkin::getUserId, user.getId()).eq(Checkin::getStatus, "published"));
            long likes = postMapper.selectList(new LambdaQueryWrapper<CommunityPost>().eq(CommunityPost::getUserId, user.getId())).stream().mapToLong(p -> p.getLikeCount() == null ? 0 : p.getLikeCount()).sum();
            CreatorVO vo = new CreatorVO(); vo.setUser(socialUser(user, userId)); vo.setPostCount(posts); vo.setCheckinCount(checkins); vo.setInfluenceScore(likes + checkins * 10 + posts * 5); result.add(vo);
        }
        Comparator<CreatorVO> comparator = "checkin".equals(metric) ? Comparator.comparingLong(CreatorVO::getCheckinCount) : "post".equals(metric) ? Comparator.comparingLong(CreatorVO::getPostCount) : Comparator.comparingLong(CreatorVO::getInfluenceScore);
        result.sort(comparator.reversed()); for (int i = 0; i < result.size(); i++) result.get(i).setRank(i + 1); return result;
    }

    private CommunityPost findPost(Long id) { CommunityPost post = postMapper.selectById(id); if (post == null) throw new BusinessException(404, "帖子不存在"); return post; }
    private CommunityPost findPublicPost(Long id) { CommunityPost post = findPost(id); if (!isPublic(post)) throw new BusinessException(404, "帖子暂不可见"); return post; }
    private boolean isPublic(CommunityPost post) { return "published".equals(post.getStatus()) || "featured".equals(post.getStatus()); }
    private void requireUser(Long userId) { if (userId == null) throw new BusinessException(401, "请先登录"); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private long safePage(long value) { return Math.max(1, value); }
    private long safeSize(long value) { return Math.min(100, Math.max(1, value)); }
    private <T> List<T> slice(List<T> list, long page, long size) { int from = (int) Math.min(list.size(), (safePage(page) - 1) * safeSize(size)); int to = (int) Math.min(list.size(), from + safeSize(size)); return list.subList(from, to); }

    private CommunityPostVO toPost(CommunityPost post, Long userId, boolean detail) {
        CommunityPostVO vo = new CommunityPostVO(); vo.setPostId(post.getId()); vo.setTitle(post.getTitle()); vo.setContent(post.getContent()); vo.setLocationName(post.getLocationName()); vo.setPublicLocation(post.getPublicLocation() != null && post.getPublicLocation() == 1); vo.setLikeCount(post.getLikeCount() == null ? 0 : post.getLikeCount()); vo.setCollectCount(post.getCollectCount() == null ? 0 : post.getCollectCount()); vo.setCommentCount(post.getCommentCount() == null ? 0 : post.getCommentCount()); vo.setShareCount(post.getShareCount() == null ? 0 : post.getShareCount()); vo.setLiked(userId != null && likeMapper.selectCount(new LambdaQueryWrapper<PostLike>().eq(PostLike::getPostId, post.getId()).eq(PostLike::getUserId, userId)) > 0); vo.setCollected(userId != null && collectMapper.selectCount(new LambdaQueryWrapper<PostCollect>().eq(PostCollect::getPostId, post.getId()).eq(PostCollect::getUserId, userId)) > 0); vo.setStatus(post.getStatus()); vo.setCreatedAt(post.getCreatedAt()); vo.setUpdatedAt(post.getUpdatedAt()); vo.setVersion(post.getVersion()); vo.setAuthor(socialUser(userMapper.selectById(post.getUserId()), userId)); if (post.getTopicId() != null) vo.setTopic(toTopic(topicMapper.selectById(post.getTopicId()), userId));
        List<String> imageUrls = imageMapper.selectList(new LambdaQueryWrapper<PostImage>().eq(PostImage::getPostId, post.getId()).orderByAsc(PostImage::getSortOrder)).stream().map(PostImage::getUrl).toList();
        if (detail) vo.setImageUrls(imageUrls);
        else if (!imageUrls.isEmpty()) vo.setImageUrls(List.of(imageUrls.get(0)));
        if (post.getLinkedBlindBoxId() != null) { BlindBox b = boxMapper.selectById(post.getLinkedBlindBoxId()); if (b != null) { LinkedContentVO x = new LinkedContentVO(); x.setId(b.getId()); x.setName(b.getName()); x.setCoverUrl(b.getCoverUrl()); x.setStatus(b.getStatus()); x.setSubtitle("¥" + fenToYuan(b.getPriceCent()) + " · 随机解锁主题线路"); vo.setLinkedBox(x); } }
        if (post.getLinkedTripId() != null) { Trip t = tripMapper.selectById(post.getLinkedTripId()); if (t != null) { LinkedContentVO x = new LinkedContentVO(); x.setId(t.getId()); x.setName(t.getRouteName()); x.setSubtitle(t.getLocation()); x.setStatus(t.getValidity()); vo.setLinkedTrip(x); } }
        if (post.getLinkedCheckinId() != null) { Checkin c = checkinMapper.selectById(post.getLinkedCheckinId()); if (c != null) { LinkedContentVO x = new LinkedContentVO(); x.setId(c.getId()); x.setName(c.getLocationName()); x.setSubtitle("打卡足迹 · " + c.getStatus()); x.setStatus(c.getStatus()); vo.setLinkedCheckin(x); } }
        return vo;
    }
    private String fenToYuan(Integer fen) { if (fen == null) return "0"; return java.math.BigDecimal.valueOf(fen, 2).stripTrailingZeros().toPlainString(); }
    private CommunityCommentVO toComment(PostComment comment) { CommunityCommentVO vo = new CommunityCommentVO(); vo.setCommentId(comment.getId()); vo.setPostId(comment.getPostId()); vo.setParentCommentId(comment.getParentId()); vo.setReplyToUserId(comment.getReplyToUserId()); vo.setContent(comment.getContent()); vo.setStatus(comment.getStatus()); vo.setCreatedAt(comment.getCreatedAt()); vo.setVersion(comment.getVersion()); vo.setAuthor(socialUser(userMapper.selectById(comment.getUserId()), null)); vo.setReplyCount(commentMapper.selectCount(new LambdaQueryWrapper<PostComment>().eq(PostComment::getParentId, comment.getId()).eq(PostComment::getStatus, "published")).intValue()); return vo; }
    private TopicVO toTopic(Topic topic, Long userId) { if (topic == null) return null; TopicVO vo = new TopicVO(); vo.setTopicId(topic.getId()); vo.setName(topic.getName()); vo.setCoverUrl(topic.getCoverUrl()); vo.setDescription(topic.getDescription()); vo.setPostCount(topic.getPostCount() == null ? 0 : topic.getPostCount()); vo.setFollowCount(topic.getFollowCount() == null ? 0 : topic.getFollowCount()); vo.setStatus(topic.getStatus()); vo.setFollowed(userId != null && topicFollowMapper.selectCount(new LambdaQueryWrapper<UserTopicFollow>().eq(UserTopicFollow::getUserId, userId).eq(UserTopicFollow::getTopicId, topic.getId())) > 0); return vo; }
    private SocialUserVO socialUser(AppUser user, Long currentUserId) { SocialUserVO vo = new SocialUserVO(); if (user == null) return vo; vo.setUserId(user.getId()); vo.setNickname(user.getNickname()); vo.setAvatarUrl(user.getAvatarUrl()); vo.setCity(user.getCity()); vo.setFollowerCount(followMapper.selectCount(new LambdaQueryWrapper<UserFollow>().eq(UserFollow::getFollowedUserId, user.getId()))); vo.setFollowed(currentUserId != null && followMapper.selectCount(new LambdaQueryWrapper<UserFollow>().eq(UserFollow::getFollowerUserId, currentUserId).eq(UserFollow::getFollowedUserId, user.getId())) > 0); return vo; }
}
