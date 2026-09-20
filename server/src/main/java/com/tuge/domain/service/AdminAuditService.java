package com.tuge.domain.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.jwt.JwtContext;
import com.tuge.domain.entity.AdminAuditLog;
import com.tuge.domain.mapper.AdminAuditLogMapper;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {
    private final AdminAuditLogMapper mapper;
    private final ObjectMapper objectMapper;

    public AdminAuditService(AdminAuditLogMapper mapper, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    public void record(String action, String targetType, Object targetId, Object detail) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(JwtContext.getUserId());
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(String.valueOf(targetId));
        try {
            log.setDetailJson(detail == null ? null : objectMapper.writeValueAsString(detail));
        } catch (JsonProcessingException ignored) {
            log.setDetailJson("{}");
        }
        mapper.insert(log);
    }
}
