package com.tuge.domain.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "orders.expiry-job-enabled", havingValue = "true", matchIfMissing = true)
public class OrderExpiryJob {
    private final OrderService orderService;

    public OrderExpiryJob(OrderService orderService) { this.orderService = orderService; }

    @Scheduled(fixedDelay = 60_000L)
    public void cancelExpiredOrders() { orderService.expireAll(); }
}
