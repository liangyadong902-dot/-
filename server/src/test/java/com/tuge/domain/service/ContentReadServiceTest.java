package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.domain.entity.Badge;
import com.tuge.domain.entity.Banner;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.entity.BlindBoxMood;
import com.tuge.domain.entity.BlindBoxScene;
import com.tuge.domain.entity.UserBadge;
import com.tuge.domain.mapper.BadgeMapper;
import com.tuge.domain.mapper.BannerMapper;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.BlindBoxMoodMapper;
import com.tuge.domain.mapper.BlindBoxSceneMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.vo.BadgeListVO;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ContentReadServiceTest {

    @BeforeEach
    void setUp() {
        initTable(Banner.class);
        initTable(BlindBox.class);
        initTable(BlindBoxMood.class);
        initTable(BlindBoxScene.class);
        initTable(Badge.class);
        initTable(UserBadge.class);
    }

    @Test
    @SuppressWarnings("unchecked")
    void filtersBoxesByShelfCategoryAndMood() {
        BlindBoxMapper boxMapper = mock(BlindBoxMapper.class);
        BlindBoxMoodMapper moodMapper = mock(BlindBoxMoodMapper.class);
        BlindBoxSceneMapper sceneMapper = mock(BlindBoxSceneMapper.class);
        BlindBoxService service = new BlindBoxService(boxMapper, moodMapper, sceneMapper, new ObjectMapper());

        BlindBoxMood mood = new BlindBoxMood();
        mood.setBoxId(8L);
        mood.setMood("emo");
        when(moodMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(mood))
                .thenReturn(List.of(mood));
        when(sceneMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());
        BlindBox box = new BlindBox();
        box.setId(8L);
        box.setName("真实盲盒");
        box.setCategory("nearby");
        box.setStatus("on");
        box.setPriceCent(9900);
        box.setMinValueCent(12000);
        when(boxMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(box));

        assertThat(service.listBoxes("nearby", "emo")).extracting("name").containsExactly("真实盲盒");

        ArgumentCaptor<LambdaQueryWrapper<BlindBox>> query = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(boxMapper).selectList(query.capture());
        query.getValue().getSqlSegment();
        assertThat(query.getValue().getParamNameValuePairs().values()).contains("on", "nearby", 8L);
    }

    @Test
    @SuppressWarnings("unchecked")
    void limitsBannersToActiveDeliveryWindow() {
        BannerMapper mapper = mock(BannerMapper.class);
        BannerService service = new BannerService(mapper);
        Banner banner = new Banner();
        banner.setId(1L);
        banner.setTitle("数据库运营位");
        when(mapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(banner));

        assertThat(service.listActive()).extracting("title").containsExactly("数据库运营位");

        ArgumentCaptor<LambdaQueryWrapper<Banner>> query = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(mapper).selectList(query.capture());
        query.getValue().getSqlSegment();
        assertThat(query.getValue().getParamNameValuePairs().values())
                .contains("on")
                .anyMatch(LocalDateTime.class::isInstance);
    }

    @Test
    @SuppressWarnings("unchecked")
    void resolvesBadgeUnlocksOnlyForCurrentUser() {
        BadgeMapper badgeMapper = mock(BadgeMapper.class);
        UserBadgeMapper userBadgeMapper = mock(UserBadgeMapper.class);
        BadgeService service = new BadgeService(badgeMapper, userBadgeMapper);
        Badge badge = new Badge();
        badge.setId(5L);
        badge.setName("山野");
        UserBadge unlocked = new UserBadge();
        unlocked.setUserId(7L);
        unlocked.setBadgeId(5L);
        unlocked.setUnlockedAt(LocalDateTime.now());
        when(badgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(badge));
        when(userBadgeMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(unlocked));

        BadgeListVO result = service.listAll(7L);

        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getList().get(0).getUnlocked()).isTrue();
        ArgumentCaptor<LambdaQueryWrapper<UserBadge>> query = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(userBadgeMapper).selectList(query.capture());
        query.getValue().getSqlSegment();
        assertThat(query.getValue().getParamNameValuePairs().values()).contains(7L, 5L);
    }

    private static void initTable(Class<?> entityType) {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), entityType);
    }
}
