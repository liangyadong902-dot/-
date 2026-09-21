package com.tuge.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DmConversationVO {
    private Long id;
    private Long peerUserId;
    private String peerNickname;
    private String peerAvatarUrl;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
