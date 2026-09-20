package com.tuge.controller;

import com.tuge.domain.service.PayNotifyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 支付宝异步通知（无 JWT）。验签入账逻辑见 {@link PayNotifyService}。
 */
@RestController
@RequestMapping("/api/v1/pay")
public class PayNotifyController {

    private final PayNotifyService payNotifyService;

    public PayNotifyController(PayNotifyService payNotifyService) {
        this.payNotifyService = payNotifyService;
    }

    @PostMapping(value = "/notify/alipay", produces = MediaType.TEXT_PLAIN_VALUE)
    public String notifyAlipay(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return payNotifyService.handleNotify(params);
    }
}
