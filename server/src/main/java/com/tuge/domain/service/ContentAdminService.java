package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.auth.AdminRoles;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.common.util.Money;
import com.tuge.domain.dto.BadgeUpsertRequest;
import com.tuge.domain.dto.BannerUpsertRequest;
import com.tuge.domain.dto.BoxUpsertRequest;
import com.tuge.domain.dto.RouteUpsertRequest;
import com.tuge.domain.entity.Badge;
import com.tuge.domain.entity.Banner;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.entity.BlindBoxMood;
import com.tuge.domain.entity.BlindBoxScene;
import com.tuge.domain.entity.TravelRoute;
import com.tuge.domain.entity.UserBadge;
import com.tuge.domain.mapper.BadgeMapper;
import com.tuge.domain.mapper.BannerMapper;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.BlindBoxMoodMapper;
import com.tuge.domain.mapper.BlindBoxSceneMapper;
import com.tuge.domain.mapper.ContentReferenceMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.vo.AdminBadgeVO;
import com.tuge.domain.vo.AdminBannerVO;
import com.tuge.domain.vo.AdminBoxVO;
import com.tuge.domain.vo.AdminRouteVO;
import com.tuge.domain.vo.RoutePoolVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 阶段二内容域管理服务。
 */
@Service
public class ContentAdminService {

    private static final Set<String> CATEGORIES = Set.of("nearby", "province", "cross", "theme");
    private static final Set<String> MOODS = Set.of("happy", "emo", "bored", "curious");
    private static final Set<String> STATUSES = Set.of("on", "off");
    private static final Set<String> JUMP_TYPES = Set.of("none", "category", "box", "url");

    private final BlindBoxMapper blindBoxMapper;
    private final BlindBoxMoodMapper moodMapper;
    private final BlindBoxSceneMapper sceneMapper;
    private final TravelRouteMapper routeMapper;
    private final BadgeMapper badgeMapper;
    private final UserBadgeMapper userBadgeMapper;
    private final BannerMapper bannerMapper;
    private final ContentReferenceMapper referenceMapper;
    private final ObjectMapper objectMapper;

    public ContentAdminService(BlindBoxMapper blindBoxMapper,
                               BlindBoxMoodMapper moodMapper,
                               BlindBoxSceneMapper sceneMapper,
                               TravelRouteMapper routeMapper,
                               BadgeMapper badgeMapper,
                               UserBadgeMapper userBadgeMapper,
                               BannerMapper bannerMapper,
                               ContentReferenceMapper referenceMapper,
                               ObjectMapper objectMapper) {
        this.blindBoxMapper = blindBoxMapper;
        this.moodMapper = moodMapper;
        this.sceneMapper = sceneMapper;
        this.routeMapper = routeMapper;
        this.badgeMapper = badgeMapper;
        this.userBadgeMapper = userBadgeMapper;
        this.bannerMapper = bannerMapper;
        this.referenceMapper = referenceMapper;
        this.objectMapper = objectMapper;
    }

    public PageResult<AdminBoxVO> listBoxes(String keyword, String category, String status,
                                            long page, long pageSize) {
        Page<BlindBox> result = new Page<>(safePage(page), safePageSize(pageSize));
        LambdaQueryWrapper<BlindBox> query = new LambdaQueryWrapper<BlindBox>()
                .like(keyword != null && !keyword.isBlank(), BlindBox::getName, keyword == null ? "" : keyword.trim())
                .eq(category != null && !category.isBlank(), BlindBox::getCategory, category)
                .eq(status != null && !status.isBlank(), BlindBox::getStatus, status)
                .orderByDesc(BlindBox::getSortWeight)
                .orderByAsc(BlindBox::getId);
        Page<BlindBox> rows = blindBoxMapper.selectPage(result, query);
        List<AdminBoxVO> list = rows.getRecords().stream().map(this::toAdminBox).toList();
        return PageResult.of(list, rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public AdminBoxVO createBox(BoxUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateBox(request);
        BlindBox box = new BlindBox();
        applyBox(box, request);
        box.setVersion(0);
        blindBoxMapper.insert(box);
        replaceMoods(box.getId(), request.moods());
        return toAdminBox(box);
    }

    @Transactional
    public AdminBoxVO updateBox(Long id, BoxUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateBox(request);
        BlindBox box = findBox(id);
        if (request.version() != null && !request.version().equals(box.getVersion())) {
            throw new BusinessException(409, "盲盒已被其他管理员更新");
        }
        applyBox(box, request);
        box.setVersion(box.getVersion() == null ? 1 : box.getVersion() + 1);
        blindBoxMapper.updateById(box);
        replaceMoods(id, request.moods());
        return toAdminBox(box);
    }

    @Transactional
    public void deleteBox(Long id) {
        AdminRoles.requireContentWrite();
        findBox(id);
        if (referenceMapper.countActiveOrdersForBox(id) > 0) {
            throw new BusinessException(409, "盲盒存在未完成订单，只能下架");
        }
        moodMapper.delete(new LambdaQueryWrapper<BlindBoxMood>().eq(BlindBoxMood::getBoxId, id));
        sceneMapper.delete(new LambdaQueryWrapper<BlindBoxScene>().eq(BlindBoxScene::getBoxId, id));
        blindBoxMapper.deleteById(id);
    }

    @Transactional
    public void updateBoxStatus(Long id, String status) {
        AdminRoles.requireContentWrite();
        validateStatus(status);
        BlindBox box = findBox(id);
        box.setStatus(status);
        blindBoxMapper.updateById(box);
    }

    public RoutePoolVO boxPool(Long id) {
        BlindBox box = findBox(id);
        List<TravelRoute> routes = routeMapper.selectList(new LambdaQueryWrapper<TravelRoute>()
                .eq(TravelRoute::getCategory, box.getCategory())
                .orderByDesc(TravelRoute::getValueCent)
                .orderByAsc(TravelRoute::getId));
        List<AdminRouteVO> list = routes.stream()
                .map(route -> toAdminRoute(route, route.getValueCent() >= box.getMinValueCent()))
                .toList();
        RoutePoolVO result = new RoutePoolVO();
        result.setRoutes(list);
        result.setOk(routes.stream().anyMatch(route -> "on".equals(route.getStatus())
                && route.getValueCent() >= box.getMinValueCent()));
        return result;
    }

    public PageResult<AdminRouteVO> listRoutes(String keyword, String category, String status,
                                               Long badgeId, long page, long pageSize) {
        Page<TravelRoute> result = new Page<>(safePage(page), safePageSize(pageSize));
        LambdaQueryWrapper<TravelRoute> query = new LambdaQueryWrapper<TravelRoute>()
                .like(keyword != null && !keyword.isBlank(), TravelRoute::getName, keyword == null ? "" : keyword.trim())
                .eq(category != null && !category.isBlank(), TravelRoute::getCategory, category)
                .eq(status != null && !status.isBlank(), TravelRoute::getStatus, status)
                .eq(badgeId != null, TravelRoute::getBadgeId, badgeId)
                .orderByDesc(TravelRoute::getValueCent)
                .orderByAsc(TravelRoute::getId);
        Page<TravelRoute> rows = routeMapper.selectPage(result, query);
        List<AdminRouteVO> list = rows.getRecords().stream().map(route -> toAdminRoute(route, false)).toList();
        return PageResult.of(list, rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public AdminRouteVO createRoute(RouteUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateRoute(request);
        TravelRoute route = new TravelRoute();
        applyRoute(route, request);
        routeMapper.insert(route);
        return toAdminRoute(route, false);
    }

    @Transactional
    public AdminRouteVO updateRoute(Long id, RouteUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateRoute(request);
        TravelRoute route = findRoute(id);
        applyRoute(route, request);
        routeMapper.updateById(route);
        return toAdminRoute(route, false);
    }

    @Transactional
    public void deleteRoute(Long id) {
        AdminRoles.requireContentWrite();
        findRoute(id);
        if (referenceMapper.countOrdersForRoute(id) > 0 || referenceMapper.countTripsForRoute(id) > 0) {
            throw new BusinessException(409, "线路已有订单或行程引用，请改为下架");
        }
        routeMapper.deleteById(id);
    }

    @Transactional
    public void updateRouteStatus(Long id, String status) {
        AdminRoles.requireContentWrite();
        validateStatus(status);
        TravelRoute route = findRoute(id);
        route.setStatus(status);
        routeMapper.updateById(route);
    }

    public PageResult<AdminBadgeVO> listBadges(long page, long pageSize) {
        Page<Badge> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<Badge> rows = badgeMapper.selectPage(result, new LambdaQueryWrapper<Badge>()
                .orderByDesc(Badge::getSortWeight).orderByAsc(Badge::getId));
        List<AdminBadgeVO> list = rows.getRecords().stream().map(this::toAdminBadge).toList();
        return PageResult.of(list, rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public AdminBadgeVO createBadge(BadgeUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateBadge(request, null);
        Badge badge = new Badge();
        applyBadge(badge, request);
        badgeMapper.insert(badge);
        return toAdminBadge(badge);
    }

    @Transactional
    public AdminBadgeVO updateBadge(Long id, BadgeUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateBadge(request, id);
        Badge badge = findBadge(id);
        applyBadge(badge, request);
        badgeMapper.updateById(badge);
        return toAdminBadge(badge);
    }

    public PageResult<AdminBannerVO> listBanners(long page, long pageSize) {
        Page<Banner> result = new Page<>(safePage(page), safePageSize(pageSize));
        Page<Banner> rows = bannerMapper.selectPage(result, new LambdaQueryWrapper<Banner>()
                .orderByDesc(Banner::getSortWeight).orderByAsc(Banner::getId));
        List<AdminBannerVO> list = rows.getRecords().stream().map(this::toAdminBanner).toList();
        return PageResult.of(list, rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    @Transactional
    public AdminBannerVO createBanner(BannerUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateBanner(request);
        Banner banner = new Banner();
        applyBanner(banner, request);
        bannerMapper.insert(banner);
        return toAdminBanner(banner);
    }

    @Transactional
    public AdminBannerVO updateBanner(Long id, BannerUpsertRequest request) {
        AdminRoles.requireContentWrite();
        validateBanner(request);
        Banner banner = findBanner(id);
        applyBanner(banner, request);
        bannerMapper.updateById(banner);
        return toAdminBanner(banner);
    }

    @Transactional
    public void deleteBanner(Long id) {
        AdminRoles.requireContentWrite();
        findBanner(id);
        bannerMapper.deleteById(id);
    }

    @Transactional
    public void updateBannerStatus(Long id, String status) {
        AdminRoles.requireContentWrite();
        validateStatus(status);
        Banner banner = findBanner(id);
        banner.setStatus(status);
        bannerMapper.updateById(banner);
    }

    private void validateBox(BoxUpsertRequest request) {
        if (request == null || blank(request.name()) || blank(request.category()) || request.price() == null
                || request.minValue() == null) {
            throw new BusinessException(400, "盲盒名称、分类、售价和保底价值不能为空");
        }
        if (!CATEGORIES.contains(request.category()) || request.price() < 0 || request.minValue() < 0) {
            throw new BusinessException(400, "盲盒分类或金额不合法");
        }
        validateMoney(request.price(), "售价");
        validateMoney(request.minValue(), "保底价值");
        if (request.status() != null) validateStatus(request.status());
        if (request.moods() != null && request.moods().stream().anyMatch(mood -> !MOODS.contains(mood))) {
            throw new BusinessException(400, "适配心情不合法");
        }
    }

    private void validateRoute(RouteUpsertRequest request) {
        if (request == null || blank(request.name()) || blank(request.category()) || blank(request.destination())
                || request.value() == null || request.badgeId() == null) {
            throw new BusinessException(400, "线路名称、分类、目的地、票面价值和徽章不能为空");
        }
        if (!CATEGORIES.contains(request.category()) || request.value() < 0
                || (request.cost() != null && request.cost() < 0)) {
            throw new BusinessException(400, "线路分类或金额不合法");
        }
        validateMoney(request.value(), "票面价值");
        if (request.cost() != null) validateMoney(request.cost(), "采购价");
        if (request.status() != null) validateStatus(request.status());
        if (badgeMapper.selectById(request.badgeId()) == null) {
            throw new BusinessException(400, "关联徽章不存在");
        }
    }

    private void validateBadge(BadgeUpsertRequest request, Long currentId) {
        if (request == null || blank(request.name()) || blank(request.mark())) {
            throw new BusinessException(400, "徽章名称和印章字不能为空");
        }
        if (request.mark().length() > 4 || request.name().length() > 32) {
            throw new BusinessException(400, "徽章名称或印章字超出长度限制");
        }
        long duplicate = badgeMapper.selectCount(new LambdaQueryWrapper<Badge>()
                .eq(Badge::getName, request.name().trim())
                .ne(currentId != null, Badge::getId, currentId));
        if (duplicate > 0) throw new BusinessException(409, "徽章名称已存在");
    }

    private void validateBanner(BannerUpsertRequest request) {
        if (request == null || blank(request.title())) throw new BusinessException(400, "Banner 标题不能为空");
        String jumpType = request.jumpType() == null ? "none" : request.jumpType();
        if (!JUMP_TYPES.contains(jumpType)) throw new BusinessException(400, "Banner 跳转类型不合法");
        if (request.startAt() != null && request.endAt() != null && request.startAt().isAfter(request.endAt())) {
            throw new BusinessException(400, "Banner 开始时间不能晚于结束时间");
        }
        if ("category".equals(jumpType) && !CATEGORIES.contains(request.jumpTarget())) {
            throw new BusinessException(400, "Banner 分类跳转目标不合法");
        }
        if ("box".equals(jumpType)) {
            try {
                if (request.jumpTarget() == null || blindBoxMapper.selectById(Long.valueOf(request.jumpTarget())) == null) {
                    throw new BusinessException(400, "Banner 盲盒跳转目标不存在");
                }
            } catch (NumberFormatException e) {
                throw new BusinessException(400, "Banner 盲盒跳转目标不合法");
            }
        }
        if ("url".equals(jumpType) && (request.jumpTarget() == null
                || !(request.jumpTarget().startsWith("https://") || request.jumpTarget().startsWith("http://")))) {
            throw new BusinessException(400, "Banner 外链必须是合法 http(s) 地址");
        }
        if (request.status() != null) validateStatus(request.status());
    }

    private void applyBox(BlindBox box, BoxUpsertRequest request) {
        box.setName(request.name().trim());
        box.setCategory(request.category());
        box.setTag(request.tag() == null ? "" : request.tag().trim());
        box.setRankTag(request.rankTag());
        box.setIntro(request.intro() == null ? "" : request.intro().trim());
        box.setDescription(request.description() == null ? "" : request.description().trim());
        box.setPriceCent(Money.cent(request.price()));
        box.setMinValueCent(Money.cent(request.minValue()));
        box.setCoverUrl(request.coverUrl());
        box.setImagesJson(writeJson(request.imageUrls() == null ? List.of() : request.imageUrls()));
        box.setIncludesJson(writeJson(request.includes() == null ? List.of() : request.includes()));
        box.setGuidePreviewJson(writeJson(request.guidePreview() == null ? Map.of() : request.guidePreview()));
        box.setSortWeight(request.sortWeight() == null ? 0 : request.sortWeight());
        box.setStatus(request.status() == null ? "on" : request.status());
    }

    private void applyRoute(TravelRoute route, RouteUpsertRequest request) {
        route.setName(request.name().trim());
        route.setCategory(request.category());
        route.setLocation(request.destination().trim());
        route.setScene(request.scene() == null ? "" : request.scene());
        route.setValueCent(Money.cent(request.value()));
        route.setCostCent(request.cost() == null ? null : Money.cent(request.cost()));
        route.setBadgeId(request.badgeId());
        route.setHighlight(request.highlight() == null ? "" : request.highlight());
        route.setIncludeJson(writeJson(request.includes() == null ? List.of() : request.includes()));
        route.setGuideJson(writeJson(request.guide() == null ? Map.of() : request.guide()));
        route.setGuideVersion(request.guideVersion() == null ? 1 : request.guideVersion());
        route.setMoodText(request.moodText() == null ? "" : request.moodText());
        route.setStatus(request.status() == null ? "on" : request.status());
    }

    private void applyBadge(Badge badge, BadgeUpsertRequest request) {
        badge.setName(request.name().trim());
        badge.setMark(request.mark().trim());
        badge.setDescription(request.description() == null ? "" : request.description().trim());
        badge.setSortWeight(request.sortWeight() == null ? 0 : request.sortWeight());
    }

    private void applyBanner(Banner banner, BannerUpsertRequest request) {
        banner.setTitle(request.title().trim());
        banner.setSubtitle(request.subTitle() == null ? "" : request.subTitle());
        banner.setTagText(request.tag() == null ? "" : request.tag());
        banner.setImageUrl(request.imageUrl());
        banner.setJumpType(request.jumpType() == null ? "none" : request.jumpType());
        banner.setJumpValue(request.jumpTarget());
        banner.setStartAt(request.startAt());
        banner.setEndAt(request.endAt());
        banner.setSortWeight(request.sortWeight() == null ? 0 : request.sortWeight());
        banner.setStatus(request.status() == null ? "on" : request.status());
    }

    private void replaceMoods(Long boxId, List<String> moods) {
        moodMapper.delete(new LambdaQueryWrapper<BlindBoxMood>().eq(BlindBoxMood::getBoxId, boxId));
        if (moods == null) return;
        moods.stream().distinct().forEach(mood -> {
            BlindBoxMood row = new BlindBoxMood();
            row.setBoxId(boxId);
            row.setMood(mood);
            moodMapper.insert(row);
        });
    }

    private AdminBoxVO toAdminBox(BlindBox box) {
        AdminBoxVO vo = new AdminBoxVO();
        vo.setId(box.getId());
        vo.setName(box.getName());
        vo.setCategory(box.getCategory());
        vo.setTag(box.getTag());
        vo.setRankTag(box.getRankTag());
        vo.setIntro(box.getIntro());
        vo.setDescription(box.getDescription());
        vo.setPrice(Money.yuan(box.getPriceCent()));
        vo.setMinValue(Money.yuan(box.getMinValueCent()));
        vo.setCoverUrl(box.getCoverUrl());
        List<String> images = readJson(box.getImagesJson());
        vo.setImageUrls(images.isEmpty() && box.getCoverUrl() != null ? List.of(box.getCoverUrl()) : images);
        vo.setMoods(loadMoods(box.getId()));
        vo.setScenes(List.of());
        vo.setIncludes(readJson(box.getIncludesJson()));
        vo.setGuidePreview(readMap(box.getGuidePreviewJson()));
        vo.setStatus(box.getStatus());
        vo.setVersion(box.getVersion());
        vo.setSortWeight(box.getSortWeight());
        vo.setOpenCount(box.getOpenCount());
        vo.setCreatedAt(box.getCreatedAt());
        vo.setUpdatedAt(box.getUpdatedAt());
        boolean poolOk = routeMapper.selectCount(new LambdaQueryWrapper<TravelRoute>()
                .eq(TravelRoute::getCategory, box.getCategory())
                .eq(TravelRoute::getStatus, "on")
                .ge(TravelRoute::getValueCent, box.getMinValueCent())) > 0;
        vo.setWarning(poolOk ? null : "当前分类没有满足保底价值的上架线路");
        return vo;
    }

    private AdminRouteVO toAdminRoute(TravelRoute route, boolean meetsGuarantee) {
        AdminRouteVO vo = new AdminRouteVO();
        vo.setId(route.getId());
        vo.setName(route.getName());
        vo.setCategory(route.getCategory());
        vo.setDestination(route.getLocation());
        vo.setScene(route.getScene());
        vo.setValue(Money.yuan(route.getValueCent()));
        vo.setCost(route.getCostCent() == null ? null : Money.yuan(route.getCostCent()));
        vo.setBadgeId(route.getBadgeId());
        Badge badge = route.getBadgeId() == null ? null : badgeMapper.selectById(route.getBadgeId());
        vo.setBadgeName(badge == null ? "" : badge.getName());
        vo.setBadgeMark(badge == null ? "" : badge.getMark());
        vo.setHighlight(route.getHighlight());
        vo.setIncludes(readJson(route.getIncludeJson()));
        vo.setGuide(readMap(route.getGuideJson()));
        vo.setGuideVersion(route.getGuideVersion());
        vo.setMoodText(route.getMoodText());
        vo.setStatus(route.getStatus());
        vo.setDrawCount(route.getDrawCount());
        vo.setMeetsGuarantee(meetsGuarantee);
        return vo;
    }

    private AdminBadgeVO toAdminBadge(Badge badge) {
        AdminBadgeVO vo = new AdminBadgeVO();
        vo.setId(badge.getId());
        vo.setName(badge.getName());
        vo.setMark(badge.getMark());
        vo.setIcon(badge.getIcon());
        vo.setDescription(badge.getDescription());
        vo.setSortWeight(badge.getSortWeight());
        vo.setUnlockedCount(userBadgeMapper.selectCount(new LambdaQueryWrapper<UserBadge>()
                .eq(UserBadge::getBadgeId, badge.getId())));
        vo.setRouteCount(routeMapper.selectCount(new LambdaQueryWrapper<TravelRoute>()
                .eq(TravelRoute::getBadgeId, badge.getId())));
        return vo;
    }

    private AdminBannerVO toAdminBanner(Banner banner) {
        AdminBannerVO vo = new AdminBannerVO();
        vo.setId(banner.getId());
        vo.setTitle(banner.getTitle());
        vo.setSubTitle(banner.getSubtitle());
        vo.setTag(banner.getTagText());
        vo.setImageUrl(banner.getImageUrl());
        vo.setJumpType(banner.getJumpType());
        vo.setJumpTarget(banner.getJumpValue());
        vo.setStartAt(banner.getStartAt());
        vo.setEndAt(banner.getEndAt());
        vo.setSortWeight(banner.getSortWeight());
        vo.setStatus(banner.getStatus());
        return vo;
    }

    private List<String> loadMoods(Long boxId) {
        return moodMapper.selectList(new LambdaQueryWrapper<BlindBoxMood>()
                .eq(BlindBoxMood::getBoxId, boxId)).stream().map(BlindBoxMood::getMood).toList();
    }

    private BlindBox findBox(Long id) {
        BlindBox box = blindBoxMapper.selectById(id);
        if (box == null) throw new BusinessException(404, "盲盒不存在");
        return box;
    }

    private TravelRoute findRoute(Long id) {
        TravelRoute route = routeMapper.selectById(id);
        if (route == null) throw new BusinessException(404, "线路不存在");
        return route;
    }

    private Badge findBadge(Long id) {
        Badge badge = badgeMapper.selectById(id);
        if (badge == null) throw new BusinessException(404, "徽章不存在");
        return badge;
    }

    private Banner findBanner(Long id) {
        Banner banner = bannerMapper.selectById(id);
        if (banner == null) throw new BusinessException(404, "Banner 不存在");
        return banner;
    }

    private void validateStatus(String status) {
        if (status == null || !STATUSES.contains(status)) throw new BusinessException(400, "状态不合法");
    }

    private void validateMoney(Double amount, String label) {
        if (BigDecimal.valueOf(amount).scale() > 2) throw new BusinessException(400, label + "最多保留两位小数");
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(400, "JSON 字段格式错误");
        }
    }

    private List<String> readJson(String value) {
        if (value == null || value.isBlank()) return List.of();
        try {
            return objectMapper.readValue(value, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            return Arrays.stream(value.replace("[", "").replace("]", "").replace("\"", "").split(","))
                    .filter(item -> !item.isBlank()).map(String::trim).toList();
        }
    }

    private Map<String, Object> readMap(String value) {
        if (value == null || value.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(value, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private long safePage(long page) {
        return Math.max(page, 1);
    }

    private long safePageSize(long pageSize) {
        return Math.min(Math.max(pageSize, 1), 100);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
