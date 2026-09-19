package com.tuge.domain.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Component
public class WechatCode2SessionClient {

    private final ObjectMapper objectMapper;
    private final String appId;
    private final String appSecret;
    private final boolean demoEnabled;
    private final RestClient restClient;

    public WechatCode2SessionClient(ObjectMapper objectMapper,
                                    @Value("${wechat.app-id:}") String appId,
                                    @Value("${wechat.app-secret:}") String appSecret,
                                    @Value("${wechat.demo-enabled:false}") boolean demoEnabled) {
        this.objectMapper = objectMapper;
        this.appId = appId;
        this.appSecret = appSecret;
        this.demoEnabled = demoEnabled;
        this.restClient = RestClient.builder().build();
    }

    public Session exchange(String code) {
        if (demoEnabled) {
            return new Session("demo-openid-local-wechat", null);
        }
        if (appId == null || appId.isBlank() || appSecret == null || appSecret.isBlank()) {
            throw new BusinessException(503, "微信登录未配置 AppSecret");
        }
        try {
            String body = restClient.get()
                    .uri(UriComponentsBuilder.fromUriString("https://api.weixin.qq.com/sns/jscode2session")
                            .queryParam("appid", appId)
                            .queryParam("secret", appSecret)
                            .queryParam("js_code", code)
                            .queryParam("grant_type", "authorization_code")
                            .build()
                            .encode()
                            .toUri())
                    .retrieve()
                    .body(String.class);
            Map<String, Object> response = objectMapper.readValue(body, new TypeReference<>() { });
            Object errorCode = response.get("errcode");
            if (errorCode != null && Integer.parseInt(String.valueOf(errorCode)) != 0) {
                throw new BusinessException(401, "微信登录凭证无效");
            }
            String openid = response.get("openid") == null ? "" : String.valueOf(response.get("openid"));
            if (openid.isBlank()) throw new BusinessException(401, "微信未返回用户标识");
            String unionid = response.get("unionid") == null ? null : String.valueOf(response.get("unionid"));
            return new Session(openid, unionid);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(503, "微信登录服务暂时不可用");
        }
    }

    public record Session(String openid, String unionid) {
    }
}
