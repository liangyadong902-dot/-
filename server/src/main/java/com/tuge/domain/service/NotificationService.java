package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.push.PushService;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.Notification;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.NotificationMapper;
import com.tuge.domain.vo.NotificationVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 站内消息通知：点赞 / 评论 / 回复 / 关注 触达
 */
@Service
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final AppUserMapper userMapper;
    private final PushService pushService;

    public NotificationService(NotificationMapper notificationMapper, AppUserMapper userMapper, PushService pushService) {
        this.notificationMapper = notificationMapper;
        this.userMapper = userMapper;
        this.pushService = pushService;
    }

    /** 写一条通知；actor 与接收人相同时跳过，异常不阻断主流程 */
    @Transactional
    public void notify(Long userId, String type, Long actorId, Long postId, Long commentId, String content) {
        try {
            if (userId == null || Objects.equals(userId, actorId)) return;
            Notification item = new Notification();
            item.setUserId(userId); item.setType(type); item.setActorId(actorId);
            item.setPostId(postId); item.setCommentId(commentId);
            item.setContent(content == null ? null : (content.length() > 255 ? content.substring(0, 255) : content));
            item.setIsRead(0);
            notificationMapper.insert(item);
            // WebSocket 实时推送给在线接收端
            pushService.push(userId, Map.of(
                    "channel", "notice",
                    "noticeId", item.getId(),
                    "type", type,
                    "actorId", actorId == null ? 0 : actorId,
                    "postId", postId == null ? 0 : postId,
                    "content", item.getContent() == null ? "" : item.getContent()));
        } catch (Exception ignored) {
        }
    }

    public PageResult<NotificationVO> list(Long userId, String type, long page, long pageSize) {
        Page<Notification> target = new Page<>(Math.max(page, 1), Math.min(Math.max(pageSize, 1), 50));
        LambdaQueryWrapper<Notification> query = new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(type != null && !type.isBlank(), Notification::getType, type)
                .orderByDesc(Notification::getId);
        Page<Notification> rows = notificationMapper.selectPage(target, query);
        List<Notification> records = rows.getRecords();
        Map<Long, AppUser> actors = records.stream().map(Notification::getActorId).filter(Objects::nonNull).distinct()
                .map(userMapper::selectById).filter(Objects::nonNull)
                .collect(Collectors.toMap(AppUser::getId, Function.identity()));
        List<NotificationVO> list = records.stream().map(n -> {
            NotificationVO vo = new NotificationVO();
            vo.setId(n.getId()); vo.setType(n.getType()); vo.setActorId(n.getActorId());
            vo.setPostId(n.getPostId()); vo.setCommentId(n.getCommentId()); vo.setContent(n.getContent());
            vo.setRead(n.getIsRead() != null && n.getIsRead() == 1); vo.setCreatedAt(n.getCreatedAt());
            AppUser actor = n.getActorId() == null ? null : actors.get(n.getActorId());
            if (actor != null) { vo.setActorNickname(actor.getNickname()); vo.setActorAvatarUrl(actor.getAvatarUrl()); }
            return vo;
        }).toList();
        return PageResult.of(list, rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public long unreadCount(Long userId) {
        return notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId).eq(Notification::getIsRead, 0));
    }

    @Transactional
    public void markRead(Long userId, Long id) {
        Notification item = notificationMapper.selectById(id);
        if (item == null || !Objects.equals(item.getUserId(), userId)) return;
        item.setIsRead(1); notificationMapper.updateById(item);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationMapper.update(null,
                new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<Notification>()
                        .eq(Notification::getUserId, userId).eq(Notification::getIsRead, 0)
                        .set(Notification::getIsRead, 1));
    }
}
