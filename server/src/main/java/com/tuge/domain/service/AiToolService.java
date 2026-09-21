package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.TravelRoute;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.TravelRouteMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.BlindBoxVO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiToolService {
    private final BlindBoxService blindBoxService;
    private final TravelRouteMapper routeMapper;
    private final TripMapper tripMapper;
    private final BizOrderMapper orderMapper;
    private final AppUserMapper userMapper;

    public AiToolService(BlindBoxService blindBoxService, TravelRouteMapper routeMapper,
                         TripMapper tripMapper, BizOrderMapper orderMapper, AppUserMapper userMapper) {
        this.blindBoxService = blindBoxService;
        this.routeMapper = routeMapper;
        this.tripMapper = tripMapper;
        this.orderMapper = orderMapper;
        this.userMapper = userMapper;
    }

    public List<BlindBoxVO> recommendBoxes(String mood, String category) {
        return blindBoxService.listBoxes(category, mood).stream().limit(5).toList();
    }

    public List<TravelRoute> searchRoutes(String keyword, String category) {
        LambdaQueryWrapper<TravelRoute> query = new LambdaQueryWrapper<TravelRoute>()
                .eq(TravelRoute::getStatus, "on")
                .eq(category != null && !category.isBlank(), TravelRoute::getCategory, category)
                .and(keyword != null && !keyword.isBlank(), q -> q.like(TravelRoute::getName, keyword)
                        .or().like(TravelRoute::getLocation, keyword)
                        .or().like(TravelRoute::getHighlight, keyword))
                .orderByDesc(TravelRoute::getDrawCount).last("LIMIT 8");
        return routeMapper.selectList(query);
    }

    public List<Trip> getMyTrips(Long userId) {
        if (userId == null) return List.of();
        return tripMapper.selectList(new LambdaQueryWrapper<Trip>()
                .eq(Trip::getUserId, userId).eq(Trip::getValidity, "valid")
                .orderByDesc(Trip::getOpenedDate).last("LIMIT 3"));
    }

    public String getValueGuard() {
        return "盲盒随机解锁主题行程；未出行退款需在「我的 → 订单」提交申请，最终以订单状态和审核结果为准。";
    }

    public String userContext(Long userId) {
        if (userId == null) return "当前为游客，不能查询私人行程。";
        AppUser user = userMapper.selectById(userId);
        if (user == null) return "当前用户资料不可用。";
        List<Trip> trips = getMyTrips(userId);
        long tripCount = tripMapper.selectCount(new LambdaQueryWrapper<Trip>()
                .eq(Trip::getUserId, userId).eq(Trip::getValidity, "valid"));
        Long pending = orderMapper.selectCount(new LambdaQueryWrapper<BizOrder>()
                .eq(BizOrder::getUserId, userId).eq(BizOrder::getStatus, "pending_pay"));
        String tripFacts = trips.stream().map(trip -> trip.getRouteName() + "(" + trip.getLocation() + ")")
                .reduce((left, right) -> left + "、" + right).orElse("暂无");
        return "用户昵称=" + user.getNickname()
                + "；最近心情=" + safe(user.getLastMood())
                + "；旅行人格=" + safe(user.getPersonalityType())
                + "；有效出行数=" + tripCount
                + "；称号=" + title(tripCount)
                + "；最近有效行程=" + tripFacts
                + "；待支付订单=" + pending + "。";
    }

    public String publicFacts() {
        String boxes = recommendBoxes(null, null).stream()
                .map(box -> box.getName() + "，价格" + box.getPrice() + "元")
                .reduce((left, right) -> left + "；" + right).orElse("暂无上架盲盒");
        String routes = searchRoutes(null, null).stream()
                .map(route -> route.getName() + "，目的地" + route.getLocation())
                .reduce((left, right) -> left + "；" + right).orElse("暂无启用线路");
        return "当前上架盲盒：" + boxes + "。当前启用线路：" + routes + "。退换规则：" + getValueGuard();
    }

    private static String safe(String value) { return value == null || value.isBlank() ? "暂无" : value; }
    private static String title(long count) { return count >= 8 ? "旅行家" : count >= 3 ? "探索者" : "旅行新手"; }
}
