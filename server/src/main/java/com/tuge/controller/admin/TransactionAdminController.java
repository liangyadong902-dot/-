package com.tuge.controller.admin;

import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.RejectRefundRequest;
import com.tuge.domain.service.AdminTransactionService;
import com.tuge.domain.vo.AdminOrderVO;
import com.tuge.domain.vo.AdminPaymentFlowVO;
import com.tuge.domain.vo.AdminRefundVO;
import com.tuge.domain.vo.AdminTripVO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/admin")
public class TransactionAdminController {
    private final AdminTransactionService service;

    public TransactionAdminController(AdminTransactionService service) { this.service = service; }

    @GetMapping("/orders")
    public Result<PageResult<AdminOrderVO>> orders(@RequestParam(required = false) String orderNo,
                                                   @RequestParam(required = false) Long userId,
                                                   @RequestParam(required = false) String status,
                                                   @RequestParam(required = false) String keyword,
                                                   @RequestParam(required = false) String channel,
                                                   @RequestParam(required = false) String from,
                                                   @RequestParam(required = false) String to,
                                                   @RequestParam(defaultValue = "1") long page,
                                                   @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.listOrders(orderNo, userId, status, keyword, channel, from, to, page, pageSize));
    }

    @GetMapping("/orders/export")
    public ResponseEntity<byte[]> exportOrders(@RequestParam(required = false) String orderNo,
                                               @RequestParam(required = false) Long userId,
                                               @RequestParam(required = false) String status,
                                               @RequestParam(required = false) String keyword,
                                               @RequestParam(required = false) String channel,
                                               @RequestParam(required = false) String from,
                                               @RequestParam(required = false) String to) {
        String csv = service.exportOrders(orderNo, userId, status, keyword, channel, from, to);
        String fileName = "tuge-orders-" + System.currentTimeMillis() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/orders/{orderNo}")
    public Result<AdminOrderVO> order(@PathVariable String orderNo) { return Result.success(service.order(orderNo)); }

    @PostMapping("/orders/{orderNo}/reopen")
    public Result<AdminOrderVO> reopen(@PathVariable String orderNo) {
        return Result.success(service.reopen(orderNo));
    }

    @GetMapping("/refunds")
    public Result<PageResult<AdminRefundVO>> refunds(@RequestParam(required = false) String status,
                                                     @RequestParam(required = false) String kind,
                                                     @RequestParam(defaultValue = "1") long page,
                                                     @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.listRefunds(status, kind, page, pageSize));
    }

    @GetMapping("/refunds/{refundNo}")
    public Result<AdminRefundVO> refund(@PathVariable String refundNo) {
        return Result.success(service.refund(refundNo));
    }

    @GetMapping("/pay-flows")
    public Result<PageResult<AdminPaymentFlowVO>> paymentFlows(@RequestParam(required = false) String orderNo,
                                                                @RequestParam(required = false) String channel,
                                                                @RequestParam(required = false) String result,
                                                                @RequestParam(defaultValue = "1") long page,
                                                                @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.listPaymentFlows(orderNo, channel, result, page, pageSize));
    }

    @GetMapping("/trips")
    public Result<PageResult<AdminTripVO>> trips(@RequestParam(required = false) String validity,
                                                 @RequestParam(required = false) Long routeId,
                                                 @RequestParam(defaultValue = "1") long page,
                                                 @RequestParam(defaultValue = "20") long pageSize) {
        return Result.success(service.listTrips(validity, routeId, page, pageSize));
    }

    @PostMapping("/refunds/{refundNo}/approve")
    public Result<Void> approve(@PathVariable String refundNo) { service.approve(refundNo); return Result.success(); }

    @PostMapping("/refunds/{refundNo}/reject")
    public Result<Void> reject(@PathVariable String refundNo, @RequestBody(required = false) RejectRefundRequest request) {
        service.reject(refundNo, request == null ? null : request.reason());
        return Result.success();
    }
}
