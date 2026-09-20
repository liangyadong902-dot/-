package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.PersonalitySubmitRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.PersonalityOption;
import com.tuge.domain.entity.PersonalityQuestion;
import com.tuge.domain.entity.PersonalityResult;
import com.tuge.domain.entity.PersonalityTest;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.PersonalityOptionMapper;
import com.tuge.domain.mapper.PersonalityQuestionMapper;
import com.tuge.domain.mapper.PersonalityResultMapper;
import com.tuge.domain.mapper.PersonalityTestMapper;
import com.tuge.domain.vo.PersonalityQuestionVO;
import com.tuge.domain.vo.PersonalityResultVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PersonalityService {
    private static final List<String> TYPE_PRIORITY = List.of("nature", "city", "adventure", "culture");

    private final PersonalityQuestionMapper questionMapper;
    private final PersonalityOptionMapper optionMapper;
    private final PersonalityResultMapper resultMapper;
    private final PersonalityTestMapper testMapper;
    private final AppUserMapper userMapper;
    private final ObjectMapper objectMapper;

    public PersonalityService(PersonalityQuestionMapper questionMapper, PersonalityOptionMapper optionMapper,
                              PersonalityResultMapper resultMapper, PersonalityTestMapper testMapper,
                              AppUserMapper userMapper, ObjectMapper objectMapper) {
        this.questionMapper = questionMapper;
        this.optionMapper = optionMapper;
        this.resultMapper = resultMapper;
        this.testMapper = testMapper;
        this.userMapper = userMapper;
        this.objectMapper = objectMapper;
    }

    public List<PersonalityQuestionVO> questions() {
        List<PersonalityQuestion> questions = activeQuestions();
        if (questions.isEmpty()) return List.of();
        List<Long> ids = questions.stream().map(PersonalityQuestion::getId).toList();
        Map<Long, List<PersonalityOption>> optionsByQuestion = new LinkedHashMap<>();
        optionMapper.selectList(new LambdaQueryWrapper<PersonalityOption>()
                        .in(PersonalityOption::getQuestionId, ids)
                        .orderByAsc(PersonalityOption::getQuestionId).orderByAsc(PersonalityOption::getSeq))
                .forEach(option -> optionsByQuestion.computeIfAbsent(option.getQuestionId(), key -> new ArrayList<>()).add(option));
        return questions.stream().map(question -> new PersonalityQuestionVO(
                question.getId(), question.getSeq(), question.getStem(),
                optionsByQuestion.getOrDefault(question.getId(), List.of()).stream()
                        .map(option -> new PersonalityQuestionVO.OptionVO(option.getId(), option.getLabel())).toList()
        )).toList();
    }

    @Transactional
    public PersonalityResultVO submit(Long userId, PersonalitySubmitRequest request) {
        List<PersonalityQuestion> questions = activeQuestions();
        if (questions.isEmpty()) throw new BusinessException(409, "人格题库暂未开放");
        if (request.answers().size() != questions.size()) throw new BusinessException(400, "请完成全部题目");

        Map<String, Integer> scores = new LinkedHashMap<>();
        TYPE_PRIORITY.forEach(type -> scores.put(type, 0));
        for (int i = 0; i < questions.size(); i++) {
            List<PersonalityOption> options = optionMapper.selectList(new LambdaQueryWrapper<PersonalityOption>()
                    .eq(PersonalityOption::getQuestionId, questions.get(i).getId())
                    .orderByAsc(PersonalityOption::getSeq));
            int selected = request.answers().get(i);
            if (selected < 0 || selected >= options.size()) throw new BusinessException(400, "人格测试答案不正确");
            parseScores(options.get(selected).getScoreJson()).forEach((type, value) -> {
                if (scores.containsKey(type)) scores.merge(type, value, Integer::sum);
            });
        }

        String resultType = TYPE_PRIORITY.get(0);
        for (String type : TYPE_PRIORITY) {
            if (scores.get(type) > scores.get(resultType)) resultType = type;
        }
        PersonalityResult result = resultMapper.selectOne(new LambdaQueryWrapper<PersonalityResult>()
                .eq(PersonalityResult::getType, resultType).last("LIMIT 1"));
        if (result == null) throw new BusinessException(500, "人格结果配置缺失");

        if (userId != null) {
            AppUser user = userMapper.selectById(userId);
            if (user == null || !"normal".equals(user.getStatus())) throw new BusinessException(403, "账号不可用");
            PersonalityTest test = new PersonalityTest();
            test.setUserId(userId);
            test.setResultType(resultType);
            test.setScoreJson(writeJson(scores));
            test.setAnswersJson(writeJson(request.answers()));
            test.setDurationMs(request.durationMs());
            testMapper.insert(test);
            user.setPersonalityType(resultType);
            user.setPersonalityAt(LocalDateTime.now());
            userMapper.updateById(user);
        }
        return toVO(result);
    }

    public PersonalityResultVO myResult(Long userId) {
        AppUser user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException(404, "用户不存在");
        if (user.getPersonalityType() == null || user.getPersonalityType().isBlank()) return null;
        PersonalityResult result = resultMapper.selectOne(new LambdaQueryWrapper<PersonalityResult>()
                .eq(PersonalityResult::getType, user.getPersonalityType()).last("LIMIT 1"));
        return result == null ? null : toVO(result);
    }

    private List<PersonalityQuestion> activeQuestions() {
        return questionMapper.selectList(new LambdaQueryWrapper<PersonalityQuestion>()
                .eq(PersonalityQuestion::getStatus, "on").orderByAsc(PersonalityQuestion::getSeq));
    }

    private Map<String, Integer> parseScores(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "人格计分配置错误");
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "人格结果保存失败");
        }
    }

    private static PersonalityResultVO toVO(PersonalityResult result) {
        return new PersonalityResultVO(result.getType(), result.getName(), result.getMark(),
                result.getDescription(), result.getRecommend());
    }
}
