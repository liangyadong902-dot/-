package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.dto.PersonalitySubmitRequest;
import com.tuge.domain.entity.PersonalityOption;
import com.tuge.domain.entity.PersonalityQuestion;
import com.tuge.domain.entity.PersonalityResult;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.PersonalityOptionMapper;
import com.tuge.domain.mapper.PersonalityQuestionMapper;
import com.tuge.domain.mapper.PersonalityResultMapper;
import com.tuge.domain.mapper.PersonalityTestMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PersonalityServiceTest {
    private PersonalityQuestionMapper questionMapper;
    private PersonalityOptionMapper optionMapper;
    private PersonalityResultMapper resultMapper;
    private PersonalityTestMapper testMapper;
    private AppUserMapper userMapper;
    private PersonalityService service;

    @BeforeEach
    void setUp() {
        initTable(PersonalityQuestion.class);
        initTable(PersonalityOption.class);
        initTable(PersonalityResult.class);
        questionMapper = mock(PersonalityQuestionMapper.class);
        optionMapper = mock(PersonalityOptionMapper.class);
        resultMapper = mock(PersonalityResultMapper.class);
        testMapper = mock(PersonalityTestMapper.class);
        userMapper = mock(AppUserMapper.class);
        service = new PersonalityService(questionMapper, optionMapper, resultMapper, testMapper,
                userMapper, new ObjectMapper());
    }

    @Test
    @SuppressWarnings("unchecked")
    void publicQuestionsNeverExposeScores() {
        PersonalityQuestion question = question(1L, 1);
        PersonalityOption option = option(11L, 1L, "看山", "{\"nature\":2}");
        when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(question));
        when(optionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(option));

        var result = service.questions();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOptions().get(0).getText()).isEqualTo("看山");
        assertThat(new ObjectMapper().valueToTree(result.get(0)).has("scoreJson")).isFalse();
        assertThat(new ObjectMapper().valueToTree(result.get(0).getOptions().get(0)).has("score")).isFalse();
    }

    @Test
    @SuppressWarnings("unchecked")
    void tieUsesDocumentedPriorityAndGuestDoesNotPersist() {
        when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(question(1L, 1)));
        when(optionMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(option(11L, 1L, "平分", "{\"nature\":1,\"city\":1,\"adventure\":1,\"culture\":1}")));
        PersonalityResult definition = new PersonalityResult();
        definition.setType("nature"); definition.setName("自然派"); definition.setMark("N");
        definition.setDescription("喜欢自然"); definition.setRecommend("山野");
        when(resultMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(definition);

        var result = service.submit(null, new PersonalitySubmitRequest(List.of(0), 1000));

        assertThat(result.getType()).isEqualTo("nature");
        verify(testMapper, never()).insert(any());
        verify(userMapper, never()).updateById(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void rejectsOptionIndexOutsideCurrentQuestion() {
        when(questionMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(question(1L, 1)));
        when(optionMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(option(11L, 1L, "A", "{\"nature\":1}")));

        assertThatThrownBy(() -> service.submit(null, new PersonalitySubmitRequest(List.of(1), null)))
                .isInstanceOf(BusinessException.class).extracting("code").isEqualTo(400);
    }

    private static PersonalityQuestion question(Long id, int seq) {
        PersonalityQuestion row = new PersonalityQuestion();
        row.setId(id); row.setSeq(seq); row.setStem("你想去哪？"); row.setStatus("on");
        return row;
    }

    private static PersonalityOption option(Long id, Long questionId, String label, String scores) {
        PersonalityOption row = new PersonalityOption();
        row.setId(id); row.setQuestionId(questionId); row.setSeq(1); row.setLabel(label); row.setScoreJson(scores);
        return row;
    }

    private static void initTable(Class<?> entityType) {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityType);
    }
}
