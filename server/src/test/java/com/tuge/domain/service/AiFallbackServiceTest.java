package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.domain.entity.AiDefaultReply;
import com.tuge.domain.entity.AiKeywordRule;
import com.tuge.domain.mapper.AiDefaultReplyMapper;
import com.tuge.domain.mapper.AiKeywordRuleMapper;
import com.tuge.domain.vo.BlindBoxVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiFallbackServiceTest {
    private AiKeywordRuleMapper ruleMapper;
    private AiDefaultReplyMapper defaultMapper;
    private BlindBoxService blindBoxService;
    private AiFallbackService service;

    @BeforeEach
    void setUp() {
        initTable(AiKeywordRule.class);
        initTable(AiDefaultReply.class);
        ruleMapper = mock(AiKeywordRuleMapper.class);
        defaultMapper = mock(AiDefaultReplyMapper.class);
        blindBoxService = mock(BlindBoxService.class);
        service = new AiFallbackService(ruleMapper, defaultMapper, blindBoxService, new ObjectMapper());
    }

    @Test
    @SuppressWarnings("unchecked")
    void usesFirstMatchingRuleAndFiltersUnavailableBoxes() {
        AiKeywordRule first = rule(1L, "[\"成都\"]", "高权重回复", "[1,2]");
        AiKeywordRule second = rule(2L, "[\"成都\"]", "低权重回复", "[]");
        when(ruleMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(first, second));
        BlindBoxVO available = new BlindBoxVO();
        available.setId(1L);
        when(blindBoxService.getBox(1L)).thenReturn(available);
        when(blindBoxService.getBox(2L)).thenThrow(new RuntimeException("已下架"));

        var reply = service.reply("想去成都");

        assertThat(reply.content()).isEqualTo("高权重回复");
        assertThat(reply.recommendBoxes()).extracting(BlindBoxVO::getId).containsExactly(1L);
        verify(defaultMapper, never()).selectOne(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void fallsBackToConfiguredDefault() {
        when(ruleMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        AiDefaultReply reply = new AiDefaultReply(); reply.setText("默认回复");
        when(defaultMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(reply);

        assertThat(service.reply("未命中").content()).isEqualTo("默认回复");
    }

    private static AiKeywordRule rule(Long id, String keywords, String reply, String boxes) {
        AiKeywordRule row = new AiKeywordRule();
        row.setId(id); row.setKeywordsJson(keywords); row.setReplyText(reply); row.setRecommendBoxIds(boxes);
        row.setStatus("on"); row.setSortWeight(100);
        return row;
    }

    private static void initTable(Class<?> entityType) {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityType);
    }
}
