package com.tuge.domain.service;

import com.tuge.domain.entity.SysConfig;
import com.tuge.domain.mapper.AiQuickQuestionMapper;
import com.tuge.domain.mapper.SysConfigMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiConfigServiceTest {
    @Test
    void databaseSwitchCannotEnableModelWithoutLocalKey() {
        SysConfigMapper mapper = mock(SysConfigMapper.class);
        SysConfig enabled = new SysConfig(); enabled.setCfgValue("true");
        when(mapper.selectById("ai.enabled")).thenReturn(enabled);
        AiProperties properties = new AiProperties(); properties.setEnabled(true); properties.setApiKey("");
        AiConfigService service = new AiConfigService(mapper, mock(AiQuickQuestionMapper.class), properties);

        assertThat(service.modelEnabled()).isFalse();

        properties.setApiKey("configured-locally");
        assertThat(service.modelEnabled()).isTrue();
    }
}
