package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.push.PushService;
import com.tuge.common.result.PageResult;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.DmConversation;
import com.tuge.domain.entity.DmMessage;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.DmConversationMapper;
import com.tuge.domain.mapper.DmMessageMapper;
import com.tuge.domain.vo.DmConversationVO;
import com.tuge.domain.vo.DmMessageVO;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 用户间私信：按 (小ID, 大ID) 维护唯一会话
 */
@Service
public class DmService {

    private final DmConversationMapper conversationMapper;
    private final DmMessageMapper messageMapper;
    private final AppUserMapper userMapper;
    private final PushService pushService;

    public DmService(DmConversationMapper conversationMapper, DmMessageMapper messageMapper, AppUserMapper userMapper, PushService pushService) {
        this.conversationMapper = conversationMapper;
        this.messageMapper = messageMapper;
        this.userMapper = userMapper;
        this.pushService = pushService;
    }

    @Transactional
    public DmMessageVO send(Long senderId, Long toUserId, String content) {
        if (Objects.equals(senderId, toUserId)) throw new BusinessException(400, "不能给自己发私信");
        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) throw new BusinessException(400, "消息内容不能为空");
        if (text.length() > 500) throw new BusinessException(400, "消息最长 500 字");
        AppUser peer = userMapper.selectById(toUserId);
        if (peer == null || !"normal".equals(peer.getStatus())) throw new BusinessException(404, "对方账号不可用");

        DmConversation conversation = requireConversation(senderId, toUserId, true);
        DmMessage message = new DmMessage();
        message.setConversationId(conversation.getId()); message.setSenderId(senderId);
        message.setContent(text); message.setIsRead(0); message.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(message);

        conversation.setLastMessage(text); conversation.setLastSenderId(senderId); conversation.setLastMessageAt(message.getCreatedAt());
        if (Objects.equals(senderId, conversation.getUserLowId())) conversation.setHighUnread(safe(conversation.getHighUnread()) + 1);
        else conversation.setLowUnread(safe(conversation.getLowUnread()) + 1);
        conversationMapper.updateById(conversation);
        // WebSocket 实时推送给在线的接收方
        pushService.push(toUserId, Map.of(
                "channel", "dm",
                "messageId", message.getId(),
                "fromUserId", senderId,
                "conversationId", conversation.getId(),
                "content", text));
        return toMessage(message, senderId);
    }

    public PageResult<DmConversationVO> conversations(Long userId) {
        List<DmConversation> all = conversationMapper.selectList(new LambdaQueryWrapper<DmConversation>()
                .eq(DmConversation::getUserLowId, userId).or().eq(DmConversation::getUserHighId, userId));
        List<DmConversationVO> list = all.stream()
                .sorted(Comparator.comparing((DmConversation c) -> c.getLastMessageAt() == null ? c.getCreatedAt() : c.getLastMessageAt(),
                        Comparator.nullsFirst(Comparator.naturalOrder())).reversed())
                .map(c -> {
                    Long peerId = Objects.equals(userId, c.getUserLowId()) ? c.getUserHighId() : c.getUserLowId();
                    DmConversationVO vo = new DmConversationVO();
                    vo.setId(c.getId()); vo.setPeerUserId(peerId);
                    AppUser peer = userMapper.selectById(peerId);
                    if (peer != null) { vo.setPeerNickname(peer.getNickname()); vo.setPeerAvatarUrl(peer.getAvatarUrl()); }
                    vo.setLastMessage(c.getLastMessage()); vo.setLastMessageAt(c.getLastMessageAt());
                    vo.setUnreadCount(Objects.equals(userId, c.getUserLowId()) ? safe(c.getLowUnread()) : safe(c.getHighUnread()));
                    return vo;
                }).toList();
        return PageResult.of(list, list.size(), 1, Math.max(list.size(), 1));
    }

    /** 读取与某人的私信，同时把对方发来的消息置为已读 */
    @Transactional
    public PageResult<DmMessageVO> messages(Long userId, Long peerUserId, long page, long pageSize) {
        DmConversation conversation = requireConversation(userId, peerUserId, false);
        if (conversation == null) return PageResult.of(List.of(), 0, page, pageSize);
        // 对方 -> 我的消息标记已读
        DmMessage probe = new DmMessage();
        messageMapper.update(probe, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<DmMessage>()
                .eq(DmMessage::getConversationId, conversation.getId())
                .ne(DmMessage::getSenderId, userId)
                .eq(DmMessage::getIsRead, 0)
                .set(DmMessage::getIsRead, 1));
        if (Objects.equals(userId, conversation.getUserLowId())) conversation.setLowUnread(0);
        else conversation.setHighUnread(0);
        conversationMapper.updateById(conversation);

        Page<DmMessage> target = new Page<>(Math.max(page, 1), Math.min(Math.max(pageSize, 1), 100));
        Page<DmMessage> rows = messageMapper.selectPage(target, new LambdaQueryWrapper<DmMessage>()
                .eq(DmMessage::getConversationId, conversation.getId())
                .orderByDesc(DmMessage::getId));
        List<DmMessageVO> list = rows.getRecords().stream().sorted(Comparator.comparing(DmMessage::getId))
                .map(m -> toMessage(m, userId)).toList();
        return PageResult.of(list, rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public long unreadTotal(Long userId) {
        return conversationMapper.selectList(new LambdaQueryWrapper<DmConversation>()
                        .eq(DmConversation::getUserLowId, userId).or().eq(DmConversation::getUserHighId, userId)).stream()
                .mapToLong(c -> Objects.equals(userId, c.getUserLowId()) ? safe(c.getLowUnread()) : safe(c.getHighUnread()))
                .sum();
    }

    /** 查找双方会话；create=true 时不存在则创建 */
    private DmConversation requireConversation(Long a, Long b, boolean create) {
        long low = Math.min(a, b), high = Math.max(a, b);
        DmConversation conversation = conversationMapper.selectOne(new LambdaQueryWrapper<DmConversation>()
                .eq(DmConversation::getUserLowId, low).eq(DmConversation::getUserHighId, high));
        if (conversation == null && create) {
            conversation = new DmConversation();
            conversation.setUserLowId(low); conversation.setUserHighId(high);
            conversation.setLowUnread(0); conversation.setHighUnread(0);
            try { conversationMapper.insert(conversation); } catch (DuplicateKeyException e) {
                conversation = conversationMapper.selectOne(new LambdaQueryWrapper<DmConversation>()
                        .eq(DmConversation::getUserLowId, low).eq(DmConversation::getUserHighId, high));
            }
        }
        return conversation;
    }

    private DmMessageVO toMessage(DmMessage message, Long viewerId) {
        DmMessageVO vo = new DmMessageVO();
        vo.setId(message.getId()); vo.setSenderId(message.getSenderId()); vo.setContent(message.getContent());
        vo.setMine(Objects.equals(message.getSenderId(), viewerId)); vo.setCreatedAt(message.getCreatedAt());
        return vo;
    }

    private int safe(Integer value) { return value == null ? 0 : value; }
}
