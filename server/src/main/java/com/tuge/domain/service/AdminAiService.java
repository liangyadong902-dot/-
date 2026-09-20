package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.AiConfigUpdateRequest;
import com.tuge.domain.dto.AiDefaultReplyRequest;
import com.tuge.domain.dto.AiKeywordRuleRequest;
import com.tuge.domain.dto.AiQuickQuestionRequest;
import com.tuge.domain.dto.DiaryTemplateRequest;
import com.tuge.domain.entity.AiDefaultReply;
import com.tuge.domain.entity.AiKeywordRule;
import com.tuge.domain.entity.AiQuickQuestion;
import com.tuge.domain.entity.DiaryTemplate;
import com.tuge.domain.mapper.AiDefaultReplyMapper;
import com.tuge.domain.mapper.AiKeywordRuleMapper;
import com.tuge.domain.mapper.AiQuickQuestionMapper;
import com.tuge.domain.mapper.DiaryTemplateMapper;
import com.tuge.domain.vo.AdminAiConfigVO;
import com.tuge.domain.vo.AdminAiKeywordRuleVO;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AdminAiService {
    private final AiConfigService configService;
    private final AiQuickQuestionMapper quickMapper;
    private final AiKeywordRuleMapper ruleMapper;
    private final AiDefaultReplyMapper defaultMapper;
    private final DiaryTemplateMapper diaryMapper;
    private final AdminAccessService accessService;
    private final AdminAuditService auditService;
    private final ObjectMapper objectMapper;

    public AdminAiService(AiConfigService configService, AiQuickQuestionMapper quickMapper,
                          AiKeywordRuleMapper ruleMapper, AiDefaultReplyMapper defaultMapper,
                          DiaryTemplateMapper diaryMapper, AdminAccessService accessService,
                          AdminAuditService auditService, ObjectMapper objectMapper) {
        this.configService = configService;
        this.quickMapper = quickMapper;
        this.ruleMapper = ruleMapper;
        this.defaultMapper = defaultMapper;
        this.diaryMapper = diaryMapper;
        this.accessService = accessService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    public AdminAiConfigVO config() {
        accessService.require(AdminAccessService.CONFIG_READ, "当前角色无 AI 配置查看权限");
        return configService.adminConfig();
    }

    @Transactional
    public AdminAiConfigVO updateConfig(AiConfigUpdateRequest request) {
        accessService.require(AdminAccessService.CONFIG_WRITE, "当前角色无 AI 配置修改权限");
        AdminAiConfigVO before = configService.adminConfig();
        AdminAiConfigVO after = configService.update(request);
        auditService.record("ai_config_update", "config", "ai", Map.of("before", before, "after", after));
        return after;
    }

    public List<AiQuickQuestion> quickQuestions() { requireRead(); return quickMapper.selectList(orderQuick()); }
    public List<AdminAiKeywordRuleVO> keywordRules() {
        requireRead();
        return ruleMapper.selectList(orderRule()).stream().map(this::toRuleVO).toList();
    }
    public List<AiDefaultReply> defaultReplies() { requireRead(); return defaultMapper.selectList(orderDefault()); }
    public List<DiaryTemplate> diaryTemplates() { requireRead(); return diaryMapper.selectList(orderDiary()); }

    @Transactional
    public AiQuickQuestion saveQuick(Long id, AiQuickQuestionRequest request) {
        requireWrite();
        AiQuickQuestion row = id == null ? new AiQuickQuestion() : find(quickMapper.selectById(id), "快捷问题不存在");
        row.setText(request.text().trim()); row.setSortWeight(weight(request.sortWeight())); row.setStatus(status(request.status()));
        if (id == null) quickMapper.insert(row); else quickMapper.updateById(row);
        auditService.record("ai_quick_save", "ai_quick_question", row.getId(), row);
        return row;
    }

    @Transactional
    public AdminAiKeywordRuleVO saveRule(Long id, AiKeywordRuleRequest request) {
        requireWrite();
        AiKeywordRule row = id == null ? new AiKeywordRule() : find(ruleMapper.selectById(id), "关键词规则不存在");
        row.setKeywordsJson(json(request.keywords())); row.setReplyText(request.replyText().trim());
        row.setRecommendBoxIds(json(request.recommendBoxIds() == null ? List.of() : request.recommendBoxIds()));
        row.setSortWeight(weight(request.sortWeight())); row.setStatus(status(request.status()));
        if (id == null) ruleMapper.insert(row); else ruleMapper.updateById(row);
        auditService.record("ai_rule_save", "ai_keyword_rule", row.getId(), row);
        return toRuleVO(row);
    }

    @Transactional
    public AiDefaultReply saveDefault(Long id, AiDefaultReplyRequest request) {
        requireWrite();
        AiDefaultReply row = id == null ? new AiDefaultReply() : find(defaultMapper.selectById(id), "默认回复不存在");
        row.setText(request.text().trim()); row.setSortWeight(weight(request.sortWeight())); row.setStatus(status(request.status()));
        if (id == null) defaultMapper.insert(row); else defaultMapper.updateById(row);
        auditService.record("ai_default_save", "ai_default_reply", row.getId(), row);
        return row;
    }

    @Transactional
    public DiaryTemplate saveDiary(Long id, DiaryTemplateRequest request) {
        requireWrite();
        DiaryTemplate row = id == null ? new DiaryTemplate() : find(diaryMapper.selectById(id), "日记模板不存在");
        row.setContent(request.content().trim()); row.setSortWeight(weight(request.sortWeight())); row.setStatus(status(request.status()));
        if (id == null) diaryMapper.insert(row); else diaryMapper.updateById(row);
        auditService.record("diary_template_save", "diary_template", row.getId(), row);
        return row;
    }

    @Transactional
    public void delete(String type, Long id) {
        requireWrite();
        int changed = switch (type) {
            case "quick" -> quickMapper.deleteById(id);
            case "rule" -> ruleMapper.deleteById(id);
            case "default" -> defaultMapper.deleteById(id);
            case "diary" -> diaryMapper.deleteById(id);
            default -> 0;
        };
        if (changed == 0) throw new BusinessException(404, "配置不存在");
        auditService.record("ai_config_delete", type, id, null);
    }

    private void requireRead() { accessService.require(AdminAccessService.CONFIG_READ, "当前角色无 AI 配置查看权限"); }
    private void requireWrite() { accessService.require(AdminAccessService.CONFIG_WRITE, "当前角色无 AI 配置修改权限"); }
    private static int weight(Integer value) { return value == null ? 0 : value; }
    private static String status(String value) { return value == null ? "on" : value; }
    private String json(Object value) { try { return objectMapper.writeValueAsString(value); } catch (JsonProcessingException e) { throw new BusinessException(400, "配置格式不正确"); } }
    private AdminAiKeywordRuleVO toRuleVO(AiKeywordRule row) {
        AdminAiKeywordRuleVO vo = new AdminAiKeywordRuleVO();
        vo.setId(row.getId()); vo.setKeywords(readList(row.getKeywordsJson(), new TypeReference<List<String>>() { }));
        vo.setReplyText(row.getReplyText());
        vo.setRecommendBoxIds(readList(row.getRecommendBoxIds(), new TypeReference<List<Long>>() { }));
        vo.setSortWeight(row.getSortWeight()); vo.setStatus(row.getStatus());
        vo.setCreatedAt(row.getCreatedAt()); vo.setUpdatedAt(row.getUpdatedAt());
        return vo;
    }
    private <T> T readList(String value, TypeReference<T> type) {
        try { return objectMapper.readValue(value == null || value.isBlank() ? "[]" : value, type); }
        catch (JsonProcessingException e) { throw new BusinessException(500, "AI 规则配置错误"); }
    }
    private static <T> T find(T value, String message) { if (value == null) throw new BusinessException(404, message); return value; }
    private static LambdaQueryWrapper<AiQuickQuestion> orderQuick() { return new LambdaQueryWrapper<AiQuickQuestion>().orderByDesc(AiQuickQuestion::getSortWeight).orderByAsc(AiQuickQuestion::getId); }
    private static LambdaQueryWrapper<AiKeywordRule> orderRule() { return new LambdaQueryWrapper<AiKeywordRule>().orderByDesc(AiKeywordRule::getSortWeight).orderByAsc(AiKeywordRule::getId); }
    private static LambdaQueryWrapper<AiDefaultReply> orderDefault() { return new LambdaQueryWrapper<AiDefaultReply>().orderByDesc(AiDefaultReply::getSortWeight).orderByAsc(AiDefaultReply::getId); }
    private static LambdaQueryWrapper<DiaryTemplate> orderDiary() { return new LambdaQueryWrapper<DiaryTemplate>().orderByDesc(DiaryTemplate::getSortWeight).orderByAsc(DiaryTemplate::getId); }
}
