package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.domain.entity.Badge;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.MoodLog;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.entity.UserBadge;
import com.tuge.domain.mapper.BadgeMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.MoodLogMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.mapper.UserBadgeMapper;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.vo.UserStatsVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

@Service
public class UserStatsService {
    private final TripMapper tripMapper;
    private final BizOrderMapper orderMapper;
    private final BadgeMapper badgeMapper;
    private final UserBadgeMapper userBadgeMapper;
    private final MoodLogMapper moodLogMapper;
    private final AppUserMapper userMapper;

    public UserStatsService(TripMapper tripMapper, BizOrderMapper orderMapper,
                            BadgeMapper badgeMapper, UserBadgeMapper userBadgeMapper,
                            MoodLogMapper moodLogMapper, AppUserMapper userMapper) {
        this.tripMapper = tripMapper;
        this.orderMapper = orderMapper;
        this.badgeMapper = badgeMapper;
        this.userBadgeMapper = userBadgeMapper;
        this.moodLogMapper = moodLogMapper;
        this.userMapper = userMapper;
    }

    public UserStatsVO get(Long userId) {
        List<Trip> trips = tripMapper.selectList(new LambdaQueryWrapper<Trip>()
                .eq(Trip::getUserId, userId)
                .eq(Trip::getValidity, "valid")
                .orderByDesc(Trip::getOpenedDate));
        List<BizOrder> orders = orderMapper.selectList(new LambdaQueryWrapper<BizOrder>()
                .eq(BizOrder::getUserId, userId)
                .in(BizOrder::getStatus, List.of("paid", "opened")));

        UserStatsVO vo = new UserStatsVO();
        vo.setTripCount(trips.size());
        vo.setSavedTotal(yuan(trips.stream().mapToInt(t -> safe(t.getValueCent()) - safe(t.getPriceCent())).sum()));
        vo.setLevelNo(Math.max(1, trips.size()));
        vo.setTitle(title(trips.size()));
        vo.setWelfareKm(BigDecimal.valueOf(trips.size()).setScale(2, RoundingMode.HALF_UP));
        vo.setBadgeUnlocked(userBadgeMapper.selectCount(new LambdaQueryWrapper<UserBadge>().eq(UserBadge::getUserId, userId)).intValue());
        vo.setBadgeTotal(badgeMapper.selectCount(null).intValue());
        vo.setDestinations(trips.stream().map(Trip::getLocation).filter(Objects::nonNull).distinct().toList());
        vo.setDestinationCount(vo.getDestinations().size());
        vo.setSpendTotal(yuan(orders.stream().mapToInt(o -> safe(o.getPaidCent())).sum()));
        vo.setMonthTrips((int) trips.stream().filter(t -> t.getOpenedDate() != null
                && YearMonth.from(t.getOpenedDate()).equals(YearMonth.now())).count());
        vo.setDiaryCount((int) trips.stream().filter(t -> t.getDiaryText() != null && !t.getDiaryText().isBlank()).count());
        com.tuge.domain.entity.AppUser user = userMapper.selectById(userId);
        vo.setPersonalityType(user == null ? null : user.getPersonalityType());
        MoodLog mood = moodLogMapper.selectOne(new LambdaQueryWrapper<MoodLog>()
                .eq(MoodLog::getUserId, userId).orderByDesc(MoodLog::getCreatedAt).last("LIMIT 1"));
        vo.setRecentMood(mood == null ? null : mood.getMood());
        vo.setFavoriteCategory(trips.stream().filter(t -> t.getBoxCategory() != null)
                .collect(java.util.stream.Collectors.groupingBy(Trip::getBoxCategory, java.util.stream.Collectors.counting()))
                .entrySet().stream().max(java.util.Map.Entry.comparingByValue()).map(java.util.Map.Entry::getKey).orElse(null));
        return vo;
    }

    private static int safe(Integer value) { return value == null ? 0 : value; }
    private static BigDecimal yuan(int cents) { return BigDecimal.valueOf(cents).movePointLeft(2).setScale(2, RoundingMode.HALF_UP); }
    private static String title(int count) { return count >= 8 ? "旅行家" : count >= 3 ? "探索者" : "旅行新手"; }
}
