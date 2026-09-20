package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.domain.entity.AiDefaultReply;
import com.tuge.domain.entity.AiKeywordRule;
import com.tuge.domain.mapper.AiDefaultReplyMapper;
import com.tuge.domain.mapper.AiKeywordRuleMapper;
import com.tuge.domain.vo.BlindBoxVO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AiFallbackService {
    private static final String BUILT_IN = "小途现在有点忙。你可以告诉我想去的城市、旅行天数或此刻的心情，我会继续帮你找灵感。";

    private final AiKeywordRuleMapper ruleMapper;
    private final AiDefaultReplyMapper defaultReplyMapper;
    private final BlindBoxService blindBoxService;
    private final ObjectMapper objectMapper;

    public AiFallbackService(AiKeywordRuleMapper ruleMapper, AiDefaultReplyMapper defaultReplyMapper,
                             BlindBoxService blindBoxService, ObjectMapper objectMapper) {
        this.ruleMapper = ruleMapper;
        this.defaultReplyMapper = defaultReplyMapper;
        this.blindBoxService = blindBoxService;
        this.objectMapper = objectMapper;
    }

    public FallbackReply reply(String input) {
        String normalized = input == null ? "" : input.toLowerCase(Locale.ROOT);
        List<AiKeywordRule> rules = ruleMapper.selectList(new LambdaQueryWrapper<AiKeywordRule>()
                .eq(AiKeywordRule::getStatus, "on")
                .orderByDesc(AiKeywordRule::getSortWeight).orderByAsc(AiKeywordRule::getId));
        for (AiKeywordRule rule : rules) {
            if (keywords(rule.getKeywordsJson()).stream().anyMatch(keyword -> normalized.contains(keyword.toLowerCase(Locale.ROOT)))) {
                return new FallbackReply(rule.getReplyText(), boxes(rule.getRecommendBoxIds()));
            }
        }
        AiDefaultReply defaultReply = defaultReplyMapper.selectOne(new LambdaQueryWrapper<AiDefaultReply>()
                .eq(AiDefaultReply::getStatus, "on")
                .orderByDesc(AiDefaultReply::getSortWeight).orderByAsc(AiDefaultReply::getId).last("LIMIT 1"));
        return new FallbackReply(defaultReply == null ? BUILT_IN : defaultReply.getText(), List.of());
    }

    private List<String> keywords(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() { });
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private List<BlindBoxVO> boxes(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            List<Long> ids = objectMapper.readValue(json, new TypeReference<>() { });
            List<BlindBoxVO> result = new ArrayList<>();
            for (Long id : ids) {
                try {
                    result.add(blindBoxService.getBox(id));
                } catch (RuntimeException ignored) {
                    // Removed or off-shelf boxes must not leak through an old fallback rule.
                }
            }
            return result;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    public record FallbackReply(String content, List<BlindBoxVO> recommendBoxes) { }
}
