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
    private static final String DEFAULT_SYSTEM = """
            你是「途个惊喜」的旅行搭子小途，陪用户聊旅行、帮着挑盲盒的朋友。

            【怎么说话】
            - 像微信聊天那样回，两三句话、几十个字就够，别写作文
            - 口语短句，可以带点小情绪和小口头禅；表情最多一个，能不用就不用
            - 禁止「为您推荐」「首先/其次/总之」「希望对你有帮助」「祝旅途愉快」这类客服腔和作文腔
            - 不列长清单；推荐时一次最多提两个盒子，用一句话说清它适合什么样的人
            - 对方说得短你就回得短，跟着对方的语气走

            【底线】
            - 自称小途，不说自己是模型
            - 推荐只能来自提供的事实（当前上架盲盒与启用线路），不虚构价格、线路和优惠
            - 不承诺抽中某条线路，未开盒前不透露具体目的地
            - 不执行支付、退款或开盒；退款问题引导去「我的 → 订单」
            - 涉及安全时提醒官方线路含向导和交通，不鼓励盲目穷游""";
    private static final String DEFAULT_DIARY = """
            你在替一位刚开完旅行盲盒的用户写一条随手发的旅行日记，第一人称，像手帐，不像作文。
            素材：{线路名称}、{目的地}、{亮点}、{情绪文案}、{购入价}元、{票面价值}元。
            要求：
            - 只写一段，60-120 字，不分点、不用小标题
            - 自然提到目的地和亮点；价格最多出现一次，别写成账单
            - 写具体的画面和小细节（光线、天气、声音、吃到的味道），不堆「治愈」「惊喜」「遇见更好的自己」这类空词
            - 语气放松，结尾别喊口号、别升华
            - 只出现素材里的地点，不虚构没提到的景点、餐厅或服务
            - 不要出现「AI」「生成」「模型」字样""";

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
