package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.service.NotificationService;
import com.tuge.domain.vo.NotificationVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }

    @GetMapping
    public Result<PageResult<NotificationVO>> list(@RequestParam(required = false) String type,
                                                   @RequestParam(defaultValue = "1") long page,
                                                   @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.list(JwtContext.getUserId(), type, page, pageSize));
    }

    @GetMapping("/unread-count")
    public Result<Long> unreadCount() { return Result.success(service.unreadCount(JwtContext.getUserId())); }

    @PutMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable Long id) { service.markRead(JwtContext.getUserId(), id); return Result.success(); }

    @PutMapping("/read-all")
    public Result<Void> markAllRead() { service.markAllRead(JwtContext.getUserId()); return Result.success(); }
}
