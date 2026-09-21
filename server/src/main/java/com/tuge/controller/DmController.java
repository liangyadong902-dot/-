package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.DmSendRequest;
import com.tuge.domain.service.DmService;
import com.tuge.domain.vo.DmConversationVO;
import com.tuge.domain.vo.DmMessageVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dm")
public class DmController {
    private final DmService service;
    public DmController(DmService service) { this.service = service; }

    @GetMapping("/conversations")
    public Result<PageResult<DmConversationVO>> conversations() {
        return Result.success(service.conversations(JwtContext.getUserId()));
    }

    @GetMapping("/unread-total")
    public Result<Long> unreadTotal() { return Result.success(service.unreadTotal(JwtContext.getUserId())); }

    @GetMapping("/messages")
    public Result<PageResult<DmMessageVO>> messages(@RequestParam Long peerUserId,
                                                    @RequestParam(defaultValue = "1") long page,
                                                    @RequestParam(defaultValue = "50") long pageSize) {
        return Result.success(service.messages(JwtContext.getUserId(), peerUserId, page, pageSize));
    }

    @PostMapping("/messages")
    public Result<DmMessageVO> send(@Valid @RequestBody DmSendRequest request) {
        return Result.success(service.send(JwtContext.getUserId(), request.toUserId(), request.content()));
    }
}
