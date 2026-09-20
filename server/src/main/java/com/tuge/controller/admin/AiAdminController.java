package com.tuge.controller.admin;

import com.tuge.common.result.Result;
import com.tuge.domain.dto.AiConfigUpdateRequest;
import com.tuge.domain.dto.AiDefaultReplyRequest;
import com.tuge.domain.dto.AiKeywordRuleRequest;
import com.tuge.domain.dto.AiQuickQuestionRequest;
import com.tuge.domain.dto.DiaryTemplateRequest;
import com.tuge.domain.entity.AiDefaultReply;
import com.tuge.domain.entity.AiKeywordRule;
import com.tuge.domain.entity.AiQuickQuestion;
import com.tuge.domain.entity.DiaryTemplate;
import com.tuge.domain.service.AdminAiService;
import com.tuge.domain.vo.AdminAiConfigVO;
import com.tuge.domain.vo.AdminAiKeywordRuleVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/ai")
public class AiAdminController {
    private final AdminAiService service;

    public AiAdminController(AdminAiService service) { this.service = service; }

    @GetMapping("/config") public Result<AdminAiConfigVO> config() { return Result.success(service.config()); }
    @PutMapping("/config") public Result<AdminAiConfigVO> updateConfig(@Valid @RequestBody AiConfigUpdateRequest request) { return Result.success(service.updateConfig(request)); }

    @GetMapping("/quick-questions") public Result<List<AiQuickQuestion>> quickQuestions() { return Result.success(service.quickQuestions()); }
    @PostMapping("/quick-questions") public Result<AiQuickQuestion> createQuick(@Valid @RequestBody AiQuickQuestionRequest request) { return Result.success(service.saveQuick(null, request)); }
    @PutMapping("/quick-questions/{id}") public Result<AiQuickQuestion> updateQuick(@PathVariable Long id, @Valid @RequestBody AiQuickQuestionRequest request) { return Result.success(service.saveQuick(id, request)); }
    @DeleteMapping("/quick-questions/{id}") public Result<Void> deleteQuick(@PathVariable Long id) { service.delete("quick", id); return Result.success(); }

    @GetMapping("/keyword-rules") public Result<List<AdminAiKeywordRuleVO>> keywordRules() { return Result.success(service.keywordRules()); }
    @PostMapping("/keyword-rules") public Result<AdminAiKeywordRuleVO> createRule(@Valid @RequestBody AiKeywordRuleRequest request) { return Result.success(service.saveRule(null, request)); }
    @PutMapping("/keyword-rules/{id}") public Result<AdminAiKeywordRuleVO> updateRule(@PathVariable Long id, @Valid @RequestBody AiKeywordRuleRequest request) { return Result.success(service.saveRule(id, request)); }
    @DeleteMapping("/keyword-rules/{id}") public Result<Void> deleteRule(@PathVariable Long id) { service.delete("rule", id); return Result.success(); }

    @GetMapping("/default-replies") public Result<List<AiDefaultReply>> defaultReplies() { return Result.success(service.defaultReplies()); }
    @PostMapping("/default-replies") public Result<AiDefaultReply> createDefault(@Valid @RequestBody AiDefaultReplyRequest request) { return Result.success(service.saveDefault(null, request)); }
    @PutMapping("/default-replies/{id}") public Result<AiDefaultReply> updateDefault(@PathVariable Long id, @Valid @RequestBody AiDefaultReplyRequest request) { return Result.success(service.saveDefault(id, request)); }
    @DeleteMapping("/default-replies/{id}") public Result<Void> deleteDefault(@PathVariable Long id) { service.delete("default", id); return Result.success(); }

    @GetMapping("/diary-templates") public Result<List<DiaryTemplate>> diaryTemplates() { return Result.success(service.diaryTemplates()); }
    @PostMapping("/diary-templates") public Result<DiaryTemplate> createDiary(@Valid @RequestBody DiaryTemplateRequest request) { return Result.success(service.saveDiary(null, request)); }
    @PutMapping("/diary-templates/{id}") public Result<DiaryTemplate> updateDiary(@PathVariable Long id, @Valid @RequestBody DiaryTemplateRequest request) { return Result.success(service.saveDiary(id, request)); }
    @DeleteMapping("/diary-templates/{id}") public Result<Void> deleteDiary(@PathVariable Long id) { service.delete("diary", id); return Result.success(); }
}
