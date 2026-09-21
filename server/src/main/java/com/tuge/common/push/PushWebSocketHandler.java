package com.tuge.common.push;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * WebSocket 处理器：握手拦截器已把 userId 写入 session attributes
 */
@Component
public class PushWebSocketHandler extends TextWebSocketHandler {

    public static final String ATTR_USER_ID = "pushUserId";

    private final PushService pushService;

    public PushWebSocketHandler(PushService pushService) {
        this.pushService = pushService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Object userId = session.getAttributes().get(ATTR_USER_ID);
        if (userId instanceof Long id) pushService.register(id, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object userId = session.getAttributes().get(ATTR_USER_ID);
        if (userId instanceof Long id) pushService.remove(id, session);
    }
}
