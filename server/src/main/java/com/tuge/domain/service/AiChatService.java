package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.AiChatRequest;
import com.tuge.domain.entity.ChatMessage;
import com.tuge.domain.mapper.ChatMessageMapper;
import com.tuge.domain.vo.AiReplyVO;
import com.tuge.domain.vo.ChatMessageVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiChatService {
    private final ChatMessageMapper messageMapper;
    private final AiMemoryService memoryService;
    private final AiConfigService configService;
    private final AiToolService toolService;
    private final AiFallbackService fallbackService;
    private final DeepSeekClient deepSeekClient;

    public AiChatService(ChatMessageMapper messageMapper, AiMemoryService memoryService,
                         AiConfigService configService, AiToolService toolService,
                         AiFallbackService fallbackService, DeepSeekClient deepSeekClient) {
        this.messageMapper = messageMapper;
        this.memoryService = memoryService;
        this.configService = configService;
        this.toolService = toolService;
        this.fallbackService = fallbackService;
        this.deepSeekClient = deepSeekClient;
    }

    @Transactional
    public AiReplyVO chat(Long userId, AiChatRequest request) {
        boolean guest = userId == null;
        String sessionId = guest ? guestSession(request.sessionId()) : null;
        String conversationId = guest ? "guest:" + sessionId : "user:" + userId;
        String redisKey = "chat:mem:" + conversationId;
        if (!guest) memoryService.warm(redisKey, databaseMemory(userId, 16));

        List<AiMemoryService.MemoryMessage> memory = memoryService.read(redisKey);
        String text = request.text().trim();
        boolean fallback = true;
        String content;
        int tokenIn = 0;
        int tokenOut = 0;
        List<com.tuge.domain.vo.BlindBoxVO> recommendations = List.of();

        try {
            if (!configService.modelEnabled()) throw new IllegalStateException("AI model disabled by config");
            List<Map<String, String>> messages = buildMessages(userId, memory, text);
            DeepSeekClient.ModelReply reply = deepSeekClient.chat(messages);
            content = reply.content();
            tokenIn = reply.tokenIn();
            tokenOut = reply.tokenOut();
            fallback = false;
        } catch (RuntimeException modelFailure) {
            if (!configService.fallbackEnabled()) {
                throw new BusinessException(503, "AI 服务暂时不可用");
            }
            AiFallbackService.FallbackReply reply = fallbackService.reply(text);
            content = reply.content();
            recommendations = reply.recommendBoxes();
        }

        memoryService.append(redisKey, new AiMemoryService.MemoryMessage("user", text), guest);
        memoryService.append(redisKey, new AiMemoryService.MemoryMessage("assistant", content), guest);
        if (!guest) persistPair(userId, conversationId, text, content,
                Boolean.TRUE.equals(request.viaQuick()), fallback, tokenIn, tokenOut);

        AiReplyVO vo = new AiReplyVO();
        vo.setContent(content);
        vo.setFallback(fallback);
        vo.setRecommendBoxes(recommendations);
        vo.setSessionId(sessionId);
        return vo;
    }

    public List<ChatMessageVO> messages(Long userId, int requestedLimit) {
        int limit = Math.min(50, Math.max(1, requestedLimit));
        List<ChatMessage> rows = new ArrayList<>(messageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getUserId, userId)
                .orderByDesc(ChatMessage::getCreatedAt).orderByDesc(ChatMessage::getId)
                .last("LIMIT " + limit)));
        Collections.reverse(rows);
        return rows.stream().map(this::toVO).toList();
    }

    private List<Map<String, String>> buildMessages(Long userId, List<AiMemoryService.MemoryMessage> memory, String text) {
        List<Map<String, String>> messages = new ArrayList<>();
        String facts = configService.toolsEnabled() ? "\n" + toolService.publicFacts() : "";
        messages.add(message("system", configService.systemPrompt() + "\n" + toolService.userContext(userId) + facts));
        memory.forEach(item -> messages.add(message(item.role(), item.content())));
        messages.add(message("user", text));
        return messages;
    }

    private List<AiMemoryService.MemoryMessage> databaseMemory(Long userId, int limit) {
        List<ChatMessage> rows = new ArrayList<>(messageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getUserId, userId)
                .orderByDesc(ChatMessage::getCreatedAt).orderByDesc(ChatMessage::getId)
                .last("LIMIT " + limit)));
        Collections.reverse(rows);
        return rows.stream().map(row -> new AiMemoryService.MemoryMessage(
                "ai".equals(row.getSender()) ? "assistant" : row.getSender(), row.getContent())).toList();
    }

    private void persistPair(Long userId, String conversationId, String userText, String assistantText,
                             boolean viaQuick, boolean fallback, int tokenIn, int tokenOut) {
        ChatMessage user = new ChatMessage();
        user.setUserId(userId);
        user.setConversationId(conversationId);
        user.setSender("user");
        user.setContent(userText);
        user.setViaQuick(viaQuick);
        user.setFallback(false);
        messageMapper.insert(user);

        ChatMessage assistant = new ChatMessage();
        assistant.setUserId(userId);
        assistant.setConversationId(conversationId);
        assistant.setSender("ai");
        assistant.setContent(assistantText);
        assistant.setViaQuick(false);
        assistant.setFallback(fallback);
        assistant.setTokenIn(tokenIn == 0 ? null : tokenIn);
        assistant.setTokenOut(tokenOut == 0 ? null : tokenOut);
        messageMapper.insert(assistant);
    }

    private ChatMessageVO toVO(ChatMessage row) {
        ChatMessageVO vo = new ChatMessageVO();
        vo.setId(row.getId());
        vo.setRole("ai".equals(row.getSender()) ? "assistant" : row.getSender());
        vo.setContent(row.getContent());
        vo.setFallback(Boolean.TRUE.equals(row.getFallback()));
        vo.setCreatedAt(row.getCreatedAt());
        return vo;
    }

    private static Map<String, String> message(String role, String content) {
        Map<String, String> value = new LinkedHashMap<>();
        value.put("role", role);
        value.put("content", content);
        return value;
    }

    private static String guestSession(String value) {
        if (value != null && value.matches("[A-Za-z0-9_-]{8,64}")) return value;
        return UUID.randomUUID().toString().replace("-", "");
    }
}
