package com.tuge.controller.admin;

import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.RejectRefundRequest;
import com.tuge.domain.service.AdminTransactionService;
import com.tuge.domain.vo.AdminOrderVO;
import com.tuge.domain.vo.AdminRefundVO;
import com.tuge.domain.vo.AdminPaymentFlowVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class TransactionAdminController {
    private final AdminTransactionService service;

    public TransactionAdminController(AdminTransactionService service) { this.service = service; }

    @GetMapping("/orders")
    public Result<PageResult<AdminOrderVO>> orders(@RequestParam(required = false) String orderNo,
                                                   @RequestParam(required = false) Long userId,
                                                   @RequestParam(required = false) String status,
                                                   @RequestParam(defaultValue = "1") long page,
                                                   @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.listOrders(orderNo, userId, status, page, pageSize));
    }

    @GetMapping("/orders/{orderNo}")
    public Result<AdminOrderVO> order(@PathVariable String orderNo) { return Result.success(service.order(orderNo)); }

    @GetMapping("/refunds")
    public Result<PageResult<AdminRefundVO>> refunds(@RequestParam(required = false) String status,
                                                     @RequestParam(defaultValue = "1") long page,
                                                     @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.listRefunds(status, page, pageSize));
    }

    @GetMapping("/pay-flows")
    public Result<PageResult<AdminPaymentFlowVO>> paymentFlows(@RequestParam(required = false) String orderNo,
                                                                @RequestParam(required = false) String channel,
                                                                @RequestParam(defaultValue = "1") long page,
                                                                @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.listPaymentFlows(orderNo, channel, page, pageSize));
    }

    @PostMapping("/refunds/{refundNo}/approve")
    public Result<Void> approve(@PathVariable String refundNo) { service.approve(refundNo); return Result.success(); }

    @PostMapping("/refunds/{refundNo}/reject")
    public Result<Void> reject(@PathVariable String refundNo, @RequestBody(required = false) RejectRefundRequest request) {
        service.reject(refundNo, request == null ? null : request.reason());
        return Result.success();
    }
}
