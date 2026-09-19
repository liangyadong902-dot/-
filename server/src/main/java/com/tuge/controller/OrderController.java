package com.tuge.controller;

import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.CreateOrderRequest;
import com.tuge.domain.dto.PayRequest;
import com.tuge.domain.dto.RefundRequest;
import com.tuge.domain.entity.RefundOrder;
import com.tuge.domain.service.OrderService;
import com.tuge.domain.vo.OrderVO;
import com.tuge.domain.vo.PayVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Result<OrderVO> create(@Valid @RequestBody CreateOrderRequest request) {
        return Result.success(orderService.create(JwtContext.getUserId(), request));
    }

    @GetMapping
    public Result<PageResult<OrderVO>> list(@RequestParam(required = false) String status,
                                            @RequestParam(defaultValue = "1") long page,
                                            @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(orderService.list(JwtContext.getUserId(), status, page, pageSize));
    }

    @GetMapping("/{orderNo}")
    public Result<OrderVO> detail(@PathVariable String orderNo) {
        return Result.success(orderService.detail(JwtContext.getUserId(), orderNo));
    }

    @PostMapping("/{orderNo}/cancel")
    public Result<Void> cancel(@PathVariable String orderNo) {
        orderService.cancel(JwtContext.getUserId(), orderNo);
        return Result.success();
    }

    @PostMapping("/{orderNo}/pay")
    public Result<PayVO> pay(@PathVariable String orderNo, @Valid @RequestBody PayRequest request) {
        return Result.success(orderService.pay(JwtContext.getUserId(), orderNo, request));
    }

    @PostMapping("/{orderNo}/refund")
    public Result<String> refund(@PathVariable String orderNo, @Valid @RequestBody RefundRequest request) {
        RefundOrder refund = orderService.requestRefund(JwtContext.getUserId(), orderNo, request);
        return Result.success(refund.getRefundNo());
    }
}
