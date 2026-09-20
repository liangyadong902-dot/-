package com.tuge.domain.service;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.AlipayConfig;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.alipay.api.request.AlipayTradeRefundRequest;
import com.alipay.api.response.AlipayTradeRefundResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.tuge.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 支付宝沙箱客户端：page.pay 拉起、trade.refund 退款、异步通知 RSA2 验签。
 * 密钥只来自 application-local.yml / 环境变量；未配置时 isConfigured()=false。
 */
@Service
public class AlipaySandboxClient {

    private final String gateway;
    private final String appId;
    private final String privateKey;
    private final String alipayPublicKey;
    private final String notifyUrl;
    private final String returnUrl;
    private final ObjectMapper objectMapper;

    private volatile AlipayClient cachedClient;

    public AlipaySandboxClient(@Value("${alipay.gateway:}") String gateway,
                               @Value("${alipay.app-id:}") String appId,
                               @Value("${alipay.private-key:}") String privateKey,
                               @Value("${alipay.alipay-public-key:}") String alipayPublicKey,
                               @Value("${alipay.notify-url:}") String notifyUrl,
                               @Value("${alipay.return-url:}") String returnUrl,
                               ObjectMapper objectMapper) {
        this.gateway = gateway;
        this.appId = appId;
        this.privateKey = privateKey;
        this.alipayPublicKey = alipayPublicKey;
        this.notifyUrl = notifyUrl;
        this.returnUrl = returnUrl;
        this.objectMapper = objectMapper;
    }

    /** 密钥是否已配置（决定 pay 接口能否走真实沙箱）。 */
    public boolean isConfigured() {
        return notBlank(appId) && notBlank(privateKey) && notBlank(alipayPublicKey);
    }

    /**
     * 生成电脑收银台支付 URL（alipay.trade.page.pay，GET 形式）。
     * out_trade_no = orderNo，金额为元字符串，与 price_cent 一致。
     */
    public String buildPagePayUrl(String orderNo, int amountCent, String subject) {
        try {
            AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
            if (notBlank(notifyUrl)) request.setNotifyUrl(notifyUrl);
            if (notBlank(returnUrl)) request.setReturnUrl(returnUrl);
            Map<String, Object> biz = new HashMap<>();
            biz.put("out_trade_no", orderNo);
            biz.put("total_amount", String.format("%.2f", amountCent / 100.0));
            biz.put("subject", subject);
            biz.put("product_code", "FAST_INSTANT_TRADE_PAY");
            request.setBizContent(objectMapper.writeValueAsString(biz));
            return client().pageExecute(request, "GET").getBody();
        } catch (AlipayApiException e) {
            throw new BusinessException(502, "拉起支付宝沙箱支付失败：" + e.getErrMsg());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(502, "拉起支付宝沙箱支付失败");
        }
    }

    /** 全额/部分退款（alipay.trade.refund），返回支付宝交易号。 */
    public String refund(String orderNo, String refundNo, int amountCent) {
        try {
            AlipayTradeRefundRequest request = new AlipayTradeRefundRequest();
            Map<String, Object> biz = new HashMap<>();
            biz.put("out_trade_no", orderNo);
            biz.put("refund_amount", String.format("%.2f", amountCent / 100.0));
            biz.put("out_request_no", refundNo);
            request.setBizContent(objectMapper.writeValueAsString(biz));
            AlipayTradeRefundResponse response = client().execute(request);
            if (!response.isSuccess()) {
                throw new BusinessException(502, "支付宝退款失败：" + response.getSubMsg());
            }
            return response.getTradeNo() != null ? response.getTradeNo() : refundNo;
        } catch (AlipayApiException e) {
            throw new BusinessException(502, "支付宝退款调用失败：" + e.getErrMsg());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(502, "支付宝退款调用失败");
        }
    }

    /** 异步通知验签（RSA2，剔除 sign，含 sign_type）。 */
    public boolean verifyNotify(Map<String, String> params) {
        try {
            return AlipaySignature.rsaCheckV2(params, alipayPublicKey, "UTF-8", "RSA2");
        } catch (AlipayApiException e) {
            return false;
        }
    }

    /** payUrl 转二维码 base64（data URL），小程序 <image> 直接展示。 */
    public String qrCodeBase64(String content) {
        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());
            hints.put(EncodeHintType.MARGIN, 1);
            BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 220, 220, hints);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (Exception e) {
            return "";
        }
    }

    private AlipayClient client() throws AlipayApiException {
        AlipayClient local = cachedClient;
        if (local == null) {
            synchronized (this) {
                if (cachedClient == null) {
                    AlipayConfig config = new AlipayConfig();
                    config.setServerUrl(gateway);
                    config.setAppId(appId);
                    config.setPrivateKey(privateKey);
                    config.setAlipayPublicKey(alipayPublicKey);
                    config.setSignType("RSA2");
                    config.setFormat("json");
                    config.setCharset("UTF-8");
                    cachedClient = new DefaultAlipayClient(config);
                }
                local = cachedClient;
            }
        }
        return local;
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
