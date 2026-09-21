package com.tuge.common.push;

import com.tuge.common.jwt.JwtTokenUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * /ws 端点：客户端以 ?token=JWT 鉴权（/ws 不在 /api/v1 下，不走登录拦截器）
 */
@Configuration
@EnableWebSocket
public class PushWebSocketConfig implements WebSocketConfigurer {

    private final PushWebSocketHandler handler;
    private final JwtTokenUtil jwtTokenUtil;

    public PushWebSocketConfig(PushWebSocketHandler handler, JwtTokenUtil jwtTokenUtil) {
        this.handler = handler;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws").addInterceptors(new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                                           @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) {
                if (request instanceof ServletServerHttpRequest servlet) {
                    String token = servlet.getServletRequest().getParameter("token");
                    try {
                        if (token != null && jwtTokenUtil.validateToken(token)) {
                            attributes.put(PushWebSocketHandler.ATTR_USER_ID, jwtTokenUtil.parseUserId(token));
                            return true;
                        }
                    } catch (Exception ignored) {
                    }
                }
                return false;
            }

            @Override
            public void afterHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                                       @NonNull WebSocketHandler wsHandler, Exception exception) {
            }
        }).setAllowedOriginPatterns("*");
    }
}
