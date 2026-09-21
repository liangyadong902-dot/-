package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.AiChatRequest;
import com.tuge.domain.entity.ChatMessage;
import com.tuge.domain.entity.AiConversation;
import com.tuge.domain.mapper.AiConversationMapper;
import com.tuge.domain.mapper.ChatMessageMapper;
import com.tuge.domain.vo.AiReplyVO;
import com.tuge.domain.vo.AiConversationVO;
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
    private final AiConversationMapper conversationMapper;
    private final AiMemoryService memoryService;
    private final AiConfigService configService;
    private final AiToolService toolService;
    private final AiFallbackService fallbackService;
    private final DeepSeekClient deepSeekClient;

    public AiChatService(ChatMessageMapper messageMapper, AiConversationMapper conversationMapper,
                         AiMemoryService memoryService,
                         AiConfigService configService, AiToolService toolService,
                         AiFallbackService fallbackService, DeepSeekClient deepSeekClient) {
        this.messageMapper = messageMapper;
        this.conversationMapper = conversationMapper;
        this.memoryService = memoryService;
        this.configService = configService;
        this.toolService = toolService;
        this.fallbackService = fallbackService;
        this.deepSeekClient = deepSeekClient;
    }

    @Transactional
    public AiReplyVO chat(Long userId, AiChatRequest request) {
        boolean guest = userId == null;
        String sessionId = guest ? guestSession(request.sessionId()) : loggedInSession(userId, request.sessionId());
        String conversationId = guest ? "guest:" + sessionId : sessionId;
        String redisKey = "chat:mem:" + conversationId;
        if (!guest) memoryService.warm(redisKey, databaseMemory(userId, conversationId, 16));

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
        return messages(userId, legacyConversation(userId), requestedLimit);
    }

    public List<ChatMessageVO> messages(Long userId, String conversationId, int requestedLimit) {
        String resolved = ownedConversation(userId, conversationId);
        int limit = Math.min(50, Math.max(1, requestedLimit));
        List<ChatMessage> rows = new ArrayList<>(messageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getUserId, userId)
                .eq(ChatMessage::getConversationId, resolved)
                .orderByDesc(ChatMessage::getCreatedAt).orderByDesc(ChatMessage::getId)
                .last("LIMIT " + limit)));
        Collections.reverse(rows);
        return rows.stream().map(this::toVO).toList();
    }

    public String createConversation(Long userId) {
        if (userId == null) throw new BusinessException(401, "请先登录");
        String id = "user:" + userId + ":" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        AiConversation row = new AiConversation();
        row.setId(id);
        row.setUserId(userId);
        row.setTitle("新对话");
        row.setLastMessage("");
        row.setMessageCount(0);
        conversationMapper.insert(row);
        return id;
    }

    public List<AiConversationVO> conversations(Long userId) {
        if (userId == null) throw new BusinessException(401, "请先登录");
        ensureLegacyConversation(userId);
        return conversationMapper.selectList(new LambdaQueryWrapper<AiConversation>()
                        .eq(AiConversation::getUserId, userId)
                        .orderByDesc(AiConversation::getUpdatedAt).orderByDesc(AiConversation::getCreatedAt))
                .stream().map(row -> new AiConversationVO(row.getId(), row.getTitle(), row.getLastMessage(),
                        row.getUpdatedAt(), row.getMessageCount() == null ? 0 : row.getMessageCount())).toList();
    }

    private List<Map<String, String>> buildMessages(Long userId, List<AiMemoryService.MemoryMessage> memory, String text) {
        List<Map<String, String>> messages = new ArrayList<>();
        String facts = configService.toolsEnabled() ? "\n" + toolService.publicFacts() : "";
        messages.add(message("system", configService.systemPrompt() + "\n" + toolService.userContext(userId) + facts));
        memory.forEach(item -> messages.add(message(item.role(), item.content())));
        messages.add(message("user", text));
        return messages;
    }

    private List<AiMemoryService.MemoryMessage> databaseMemory(Long userId, String conversationId, int limit) {
        List<ChatMessage> rows = new ArrayList<>(messageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getUserId, userId)
                .eq(ChatMessage::getConversationId, conversationId)
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

        String title = userText.length() > 18 ? userText.substring(0, 18) : userText;
        String preview = assistantText.length() > 120 ? assistantText.substring(0, 120) : assistantText;
        conversationMapper.update(null, new LambdaUpdateWrapper<AiConversation>()
                .eq(AiConversation::getId, conversationId).eq(AiConversation::getUserId, userId)
                .eq(AiConversation::getMessageCount, 0)
                .set(AiConversation::getTitle, title));
        conversationMapper.update(null, new LambdaUpdateWrapper<AiConversation>()
                .eq(AiConversation::getId, conversationId).eq(AiConversation::getUserId, userId)
                .setSql("message_count = message_count + 2")
                .set(AiConversation::getLastMessage, preview));
    }

    private ChatMessageVO toVO(ChatMessage row) {
        ChatMessageVO vo = new ChatMessageVO();
        vo.setId(row.getId());
        vo.setConversationId(row.getConversationId());
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

    private static String legacyConversation(Long userId) {
        return "user:" + userId;
    }

    private String loggedInSession(Long userId, String requested) {
        if (requested == null || requested.isBlank()) {
            ensureLegacyConversation(userId);
            return legacyConversation(userId);
        }
        String prefix = legacyConversation(userId);
        if (!(requested.equals(prefix) || requested.matches("user:" + userId + ":[A-Za-z0-9_-]{8,40}"))) {
            throw new BusinessException(403, "无权访问该会话");
        }
        AiConversation row = conversationMapper.selectById(requested);
        if (row == null && requested.equals(prefix)) {
            ensureLegacyConversation(userId);
            return requested;
        }
        if (row == null || !userId.equals(row.getUserId())) throw new BusinessException(404, "会话不存在");
        return requested;
    }

    private void ensureLegacyConversation(Long userId) {
        String id = legacyConversation(userId);
        if (conversationMapper.selectById(id) != null) return;
        List<ChatMessage> rows = messageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .eq(ChatMessage::getUserId, userId).eq(ChatMessage::getConversationId, id)
                .orderByAsc(ChatMessage::getCreatedAt).orderByAsc(ChatMessage::getId));
        if (rows.isEmpty()) return;
        ChatMessage firstUser = rows.stream().filter(row -> "user".equals(row.getSender())).findFirst().orElse(rows.get(0));
        ChatMessage latest = rows.get(rows.size() - 1);
        AiConversation conversation = new AiConversation();
        conversation.setId(id);
        conversation.setUserId(userId);
        conversation.setTitle(shortText(firstUser.getContent(), 18));
        conversation.setLastMessage(shortText(latest.getContent(), 120));
        conversation.setMessageCount(rows.size());
        conversationMapper.insert(conversation);
    }

    private String ownedConversation(Long userId, String requested) {
        if (userId == null) throw new BusinessException(401, "请先登录");
        return loggedInSession(userId, requested);
    }

    private static String shortText(String value, int length) {
        String text = value == null ? "" : value;
        return text.length() > length ? text.substring(0, length) : text;
    }

}
