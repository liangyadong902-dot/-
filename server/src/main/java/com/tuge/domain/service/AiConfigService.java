package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.domain.dto.AiConfigUpdateRequest;
import com.tuge.domain.entity.AiQuickQuestion;
import com.tuge.domain.entity.SysConfig;
import com.tuge.domain.mapper.AiQuickQuestionMapper;
import com.tuge.domain.mapper.SysConfigMapper;
import com.tuge.domain.vo.AdminAiConfigVO;
import com.tuge.domain.vo.AiConfigVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AiConfigService {
    private static final String DEFAULT_GREET = "嗨～我是你的旅行搭子小途，不知道去哪玩都可以问我哦！";
    private static final String DEFAULT_SYSTEM = "你是途个惊喜的旅行搭子小途。只根据提供的事实推荐，不虚构价格和线路，不承诺抽中特定线路，不执行支付、退款或开盒。";
    private static final String DEFAULT_DIARY = "根据行程事实写一段简短的第一人称旅行日记，不要虚构地点和服务。";

    private final SysConfigMapper configMapper;
    private final AiQuickQuestionMapper quickQuestionMapper;
    private final AiProperties properties;

    public AiConfigService(SysConfigMapper configMapper, AiQuickQuestionMapper quickQuestionMapper,
                           AiProperties properties) {
        this.configMapper = configMapper;
        this.quickQuestionMapper = quickQuestionMapper;
        this.properties = properties;
    }

    public AiConfigVO publicConfig() {
        List<String> quick = quickQuestionMapper.selectList(new LambdaQueryWrapper<AiQuickQuestion>()
                        .eq(AiQuickQuestion::getStatus, "on")
                        .orderByDesc(AiQuickQuestion::getSortWeight).orderByAsc(AiQuickQuestion::getId))
                .stream().map(AiQuickQuestion::getText).toList();
        return new AiConfigVO(value("ai.welcome", DEFAULT_GREET), quick);
    }

    public AdminAiConfigVO adminConfig() {
        AdminAiConfigVO vo = new AdminAiConfigVO();
        vo.setGreet(value("ai.welcome", DEFAULT_GREET));
        vo.setSystemPrompt(value("ai.system_prompt", DEFAULT_SYSTEM));
        vo.setDiaryPrompt(value("ai.diary_prompt", DEFAULT_DIARY));
        vo.setEnabled(booleanValue("ai.enabled", properties.isEnabled()));
        vo.setToolsEnabled(booleanValue("ai.tools_enabled", properties.isToolsEnabled()));
        vo.setFallbackEnabled(booleanValue("ai.fallback_enabled", properties.isFallbackEnabled()));
        return vo;
    }

    @Transactional
    public AdminAiConfigVO update(AiConfigUpdateRequest request) {
        put("ai.welcome", request.greet(), "AI 页开场白");
        put("ai.system_prompt", request.systemPrompt(), "小途系统 Prompt");
        put("ai.diary_prompt", request.diaryPrompt(), "旅行日记 Prompt");
        if (request.enabled() != null) put("ai.enabled", request.enabled().toString(), "AI 模型开关");
        if (request.toolsEnabled() != null) put("ai.tools_enabled", request.toolsEnabled().toString(), "AI 工具开关");
        if (request.fallbackEnabled() != null) put("ai.fallback_enabled", request.fallbackEnabled().toString(), "AI 降级开关");
        return adminConfig();
    }

    public String systemPrompt() { return value("ai.system_prompt", DEFAULT_SYSTEM); }
    public String diaryPrompt() { return value("ai.diary_prompt", DEFAULT_DIARY); }
    public boolean modelEnabled() {
        return properties.modelAvailable() && booleanValue("ai.enabled", properties.isEnabled());
    }
    public boolean toolsEnabled() { return booleanValue("ai.tools_enabled", properties.isToolsEnabled()); }
    public boolean fallbackEnabled() { return booleanValue("ai.fallback_enabled", properties.isFallbackEnabled()); }

    private String value(String key, String fallback) {
        SysConfig row = configMapper.selectById(key);
        return row == null || row.getCfgValue() == null || row.getCfgValue().isBlank() ? fallback : row.getCfgValue();
    }

    private boolean booleanValue(String key, boolean fallback) {
        String value = value(key, Boolean.toString(fallback));
        return "true".equalsIgnoreCase(value);
    }

    private void put(String key, String value, String remark) {
        SysConfig row = new SysConfig();
        row.setCfgKey(key);
        row.setCfgValue(value);
        row.setRemark(remark);
        if (configMapper.selectById(key) == null) configMapper.insert(row);
        else configMapper.updateById(row);
    }
}
