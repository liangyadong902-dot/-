package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.AiChatRequest;
import com.tuge.domain.service.AiChatService;
import com.tuge.domain.service.AiConfigService;
import com.tuge.domain.vo.AiConfigVO;
import com.tuge.domain.vo.AiConversationVO;
import com.tuge.domain.vo.AiReplyVO;
import com.tuge.domain.vo.ChatMessageVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ai")
@Validated
public class AiController {
    private final AiConfigService configService;
    private final AiChatService chatService;

    public AiController(AiConfigService configService, AiChatService chatService) {
        this.configService = configService;
        this.chatService = chatService;
    }

    @GetMapping("/config")
    public Result<AiConfigVO> config() {
        return Result.success(configService.publicConfig());
    }

    @GetMapping("/messages")
    public Result<List<ChatMessageVO>> messages(@RequestParam(defaultValue = "16") int limit) {
        return Result.success(chatService.messages(JwtContext.getUserId(), limit));
    }

    @GetMapping("/conversations")
    public Result<List<AiConversationVO>> conversations() {
        return Result.success(chatService.conversations(JwtContext.getUserId()));
    }

    @PostMapping("/conversations")
    public Result<AiConversationVO> createConversation() {
        String id = chatService.createConversation(JwtContext.getUserId());
        return Result.success(new AiConversationVO(id, "新对话", "", null, 0));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public Result<List<ChatMessageVO>> conversationMessages(@PathVariable String conversationId,
                                                             @RequestParam(defaultValue = "50") int limit) {
        return Result.success(chatService.messages(JwtContext.getUserId(), conversationId, limit));
    }

    @PostMapping("/chat")
    public Result<AiReplyVO> chat(@Valid @RequestBody AiChatRequest request) {
        return Result.success(chatService.chat(JwtContext.getUserId(), request));
    }

    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam @NotBlank @Size(max = 2000) String text,
                             @RequestParam(defaultValue = "false") boolean viaQuick,
                             @RequestParam(required = false) @Size(max = 64) String sessionId) {
        AiReplyVO reply = chatService.chat(JwtContext.getUserId(), new AiChatRequest(text, viaQuick, sessionId));
        SseEmitter emitter = new SseEmitter(0L);
        try {
            emitter.send(SseEmitter.event().name("message").data(reply, MediaType.APPLICATION_JSON));
            emitter.complete();
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }
}
