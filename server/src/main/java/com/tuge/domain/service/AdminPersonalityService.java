package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.AdminPersonalityOptionRequest;
import com.tuge.domain.dto.AdminPersonalityQuestionRequest;
import com.tuge.domain.dto.AdminPersonalityResultRequest;
import com.tuge.domain.entity.PersonalityOption;
import com.tuge.domain.entity.PersonalityQuestion;
import com.tuge.domain.entity.PersonalityResult;
import com.tuge.domain.entity.PersonalityTest;
import com.tuge.domain.mapper.PersonalityOptionMapper;
import com.tuge.domain.mapper.PersonalityQuestionMapper;
import com.tuge.domain.mapper.PersonalityResultMapper;
import com.tuge.domain.mapper.PersonalityTestMapper;
import com.tuge.domain.vo.AdminPersonalityQuestionVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AdminPersonalityService {
    private static final Set<String> SCORE_TYPES = Set.of("nature", "city", "adventure", "culture");

    private final PersonalityQuestionMapper questionMapper;
    private final PersonalityOptionMapper optionMapper;
    private final PersonalityResultMapper resultMapper;
    private final PersonalityTestMapper testMapper;
    private final AdminAccessService accessService;
    private final AdminAuditService auditService;
    private final ObjectMapper objectMapper;

    public AdminPersonalityService(PersonalityQuestionMapper questionMapper, PersonalityOptionMapper optionMapper,
                                   PersonalityResultMapper resultMapper, PersonalityTestMapper testMapper,
                                   AdminAccessService accessService, AdminAuditService auditService,
                                   ObjectMapper objectMapper) {
        this.questionMapper = questionMapper; this.optionMapper = optionMapper; this.resultMapper = resultMapper;
        this.testMapper = testMapper; this.accessService = accessService; this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    public List<AdminPersonalityQuestionVO> questions() {
        requireRead();
        List<PersonalityQuestion> questions = questionMapper.selectList(new LambdaQueryWrapper<PersonalityQuestion>().orderByAsc(PersonalityQuestion::getSeq));
        if (questions.isEmpty()) return List.of();
        Map<Long, List<PersonalityOption>> grouped = new LinkedHashMap<>();
        optionMapper.selectList(new LambdaQueryWrapper<PersonalityOption>()
                        .in(PersonalityOption::getQuestionId, questions.stream().map(PersonalityQuestion::getId).toList())
                        .orderByAsc(PersonalityOption::getQuestionId).orderByAsc(PersonalityOption::getSeq))
                .forEach(option -> grouped.computeIfAbsent(option.getQuestionId(), key -> new ArrayList<>()).add(option));
        return questions.stream().map(question -> toVO(question, grouped.getOrDefault(question.getId(), List.of()))).toList();
    }

    public List<PersonalityResult> results() {
        requireRead();
        return resultMapper.selectList(new LambdaQueryWrapper<PersonalityResult>().orderByAsc(PersonalityResult::getId));
    }

    @Transactional
    public PersonalityQuestion saveQuestion(Long id, AdminPersonalityQuestionRequest request) {
        requireWrite();
        PersonalityQuestion row = id == null ? new PersonalityQuestion() : require(questionMapper.selectById(id), "题目不存在");
        row.setSeq(request.seq()); row.setStem(request.stem().trim()); row.setStatus(request.status() == null ? "on" : request.status());
        if (id == null) questionMapper.insert(row); else questionMapper.updateById(row);
        auditService.record("personality_question_save", "personality_question", row.getId(), row);
        return row;
    }

    @Transactional
    public PersonalityOption saveOption(Long questionId, Long id, AdminPersonalityOptionRequest request) {
        requireWrite();
        if (id == null && questionMapper.selectById(questionId) == null) throw new BusinessException(404, "题目不存在");
        PersonalityOption row = id == null ? new PersonalityOption() : require(optionMapper.selectById(id), "选项不存在");
        if (id == null) row.setQuestionId(questionId);
        validateScore(request.score());
        row.setSeq(request.seq()); row.setLabel(request.label().trim()); row.setScoreJson(write(request.score()));
        if (id == null) optionMapper.insert(row); else optionMapper.updateById(row);
        auditService.record("personality_option_save", "personality_option", row.getId(), row);
        return row;
    }

    @Transactional
    public PersonalityResult saveResult(Long id, AdminPersonalityResultRequest request) {
        requireWrite();
        PersonalityResult row = id == null ? new PersonalityResult() : require(resultMapper.selectById(id), "人格结果不存在");
        row.setType(request.type()); row.setName(request.name().trim()); row.setMark(request.mark().trim());
        row.setDescription(request.description().trim()); row.setRecommend(request.recommend().trim());
        if (id == null) resultMapper.insert(row); else resultMapper.updateById(row);
        auditService.record("personality_result_save", "personality_result", row.getId(), row);
        return row;
    }

    @Transactional
    public void deleteQuestion(Long id) {
        requireWrite(); preventHistoricalDelete();
        if (questionMapper.deleteById(id) == 0) throw new BusinessException(404, "题目不存在");
        optionMapper.delete(new LambdaQueryWrapper<PersonalityOption>().eq(PersonalityOption::getQuestionId, id));
        auditService.record("personality_question_delete", "personality_question", id, null);
    }

    @Transactional
    public void deleteOption(Long id) {
        requireWrite(); preventHistoricalDelete();
        if (optionMapper.deleteById(id) == 0) throw new BusinessException(404, "选项不存在");
        auditService.record("personality_option_delete", "personality_option", id, null);
    }

    @Transactional
    public void deleteResult(Long id) {
        requireWrite();
        PersonalityResult row = require(resultMapper.selectById(id), "人格结果不存在");
        if (testMapper.selectCount(new LambdaQueryWrapper<PersonalityTest>().eq(PersonalityTest::getResultType, row.getType())) > 0) {
            throw new BusinessException(409, "该人格结果已有作答记录，不能删除");
        }
        resultMapper.deleteById(id);
        auditService.record("personality_result_delete", "personality_result", id, null);
    }

    private AdminPersonalityQuestionVO toVO(PersonalityQuestion question, List<PersonalityOption> options) {
        AdminPersonalityQuestionVO vo = new AdminPersonalityQuestionVO();
        vo.setId(question.getId()); vo.setSeq(question.getSeq()); vo.setStem(question.getStem());
        vo.setStatus(question.getStatus()); vo.setUpdatedAt(question.getUpdatedAt());
        vo.setOptions(options.stream().map(option -> {
            AdminPersonalityQuestionVO.OptionVO item = new AdminPersonalityQuestionVO.OptionVO();
            item.setId(option.getId()); item.setQuestionId(option.getQuestionId()); item.setSeq(option.getSeq());
            item.setLabel(option.getLabel()); item.setScore(read(option.getScoreJson())); return item;
        }).toList());
        return vo;
    }

    private void validateScore(Map<String, Integer> score) {
        if (score.keySet().stream().anyMatch(key -> !SCORE_TYPES.contains(key))) throw new BusinessException(400, "计分维度不正确");
    }
    private void preventHistoricalDelete() { if (testMapper.selectCount(null) > 0) throw new BusinessException(409, "已有作答记录，只能下架题目"); }
    private void requireRead() { accessService.require(AdminAccessService.CONFIG_READ, "当前角色无人格配置查看权限"); }
    private void requireWrite() { accessService.require(AdminAccessService.CONFIG_WRITE, "当前角色无人格配置修改权限"); }
    private String write(Object value) { try { return objectMapper.writeValueAsString(value); } catch (Exception e) { throw new BusinessException(400, "计分格式不正确"); } }
    private Map<String, Integer> read(String value) { try { return objectMapper.readValue(value, new TypeReference<>() { }); } catch (Exception e) { return Map.of(); } }
    private static <T> T require(T value, String message) { if (value == null) throw new BusinessException(404, message); return value; }
}
