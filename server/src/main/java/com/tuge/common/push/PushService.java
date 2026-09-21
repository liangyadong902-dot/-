package com.tuge.common.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * 实时推送：按用户维护 WebSocket 会话，支持多端登录
 */
@Component
public class PushService {

    private static final Logger log = LoggerFactory.getLogger(PushService.class);

    private final Map<Long, CopyOnWriteArraySet<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void register(Long userId, WebSocketSession session) {
        sessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
    }

    public void remove(Long userId, WebSocketSession session) {
        CopyOnWriteArraySet<WebSocketSession> set = sessions.get(userId);
        if (set != null) {
            set.remove(session);
            if (set.isEmpty()) sessions.remove(userId, set);
        }
    }

    /** 推送 JSON 消息给指定用户的所有在线端；离线则静默丢弃（客户端有轮询兜底） */
    public void push(Long userId, Map<String, Object> payload) {
        CopyOnWriteArraySet<WebSocketSession> set = sessions.get(userId);
        if (set == null || set.isEmpty()) return;
        String text;
        try {
            text = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.warn("push serialize failed: {}", e.getMessage());
            return;
        }
        for (WebSocketSession session : set) {
            try {
                if (session.isOpen()) synchronized (session) { session.sendMessage(new TextMessage(text)); }
            } catch (Exception e) {
                log.warn("push to user {} failed: {}", userId, e.getMessage());
            }
        }
    }

    public boolean online(Long userId) {
        CopyOnWriteArraySet<WebSocketSession> set = sessions.get(userId);
        return set != null && !set.isEmpty();
    }
}
