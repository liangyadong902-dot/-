package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.BizOrder;
import com.tuge.domain.entity.ChatMessage;
import com.tuge.domain.entity.MoodLog;
import com.tuge.domain.entity.RefundOrder;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.BizOrderMapper;
import com.tuge.domain.mapper.ChatMessageMapper;
import com.tuge.domain.mapper.MoodLogMapper;
import com.tuge.domain.mapper.RefundOrderMapper;
import com.tuge.domain.mapper.TripMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AdminStatsService {
    private final AppUserMapper userMapper;
    private final BizOrderMapper orderMapper;
    private final RefundOrderMapper refundMapper;
    private final TripMapper tripMapper;
    private final MoodLogMapper moodMapper;
    private final ChatMessageMapper messageMapper;
    private final AdminAccessService accessService;

    public AdminStatsService(AppUserMapper userMapper, BizOrderMapper orderMapper, RefundOrderMapper refundMapper,
                             TripMapper tripMapper, MoodLogMapper moodMapper, ChatMessageMapper messageMapper,
                             AdminAccessService accessService) {
        this.userMapper = userMapper;
        this.orderMapper = orderMapper;
        this.refundMapper = refundMapper;
        this.tripMapper = tripMapper;
        this.moodMapper = moodMapper;
        this.messageMapper = messageMapper;
        this.accessService = accessService;
    }

    public Map<String, Object> users(LocalDate begin, LocalDate end) {
        accessService.require(AdminAccessService.ALL, "当前角色无统计查看权限");
        Range range = range(begin, end);
        List<AppUser> all = userMapper.selectList(new LambdaQueryWrapper<>());
        long newUsers = all.stream().filter(user -> inRange(user.getCreatedAt(), range)).count();
        long activeUsers = all.stream().filter(user -> inRange(user.getLastActiveAt(), range)).count();
        List<MoodLog> moods = moodMapper.selectList(new LambdaQueryWrapper<MoodLog>()
                .ge(MoodLog::getCreatedAt, range.start()).lt(MoodLog::getCreatedAt, range.endExclusive()));
        List<ChatMessage> messages = messageMapper.selectList(new LambdaQueryWrapper<ChatMessage>()
                .ge(ChatMessage::getCreatedAt, range.start()).lt(ChatMessage::getCreatedAt, range.endExclusive()));
        List<BizOrder> orders = orders(range);
        List<Trip> validTrips = tripMapper.selectList(new LambdaQueryWrapper<Trip>()
                .eq(Trip::getValidity, "valid"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("users", Map.of("registered", all.size(), "new", newUsers, "active", activeUsers));
        result.put("funnel", List.of(
                funnel("visit", "访问", null, null), funnel("mood", "选心情", (long) moods.size(), null),
                funnel("box_view", "浏览盲盒", null, null), funnel("open_click", "点击开盒", null, null),
                funnel("order", "创单", (long) orders.size(), null), funnel("pay", "支付", paidCount(orders), null),
                funnel("opened", "开盒完成", openedCount(orders), null)));
        result.put("titleDistribution", titleDistribution(all, validTrips));
        result.put("moodDistribution", distribution(moods.stream().map(MoodLog::getMood).toList()));
        long fallbackCount = messages.stream().filter(message -> Boolean.TRUE.equals(message.getFallback())).count();
        long aiReplyCount = messages.stream().filter(message -> "ai".equals(message.getSender())).count();
        long aiUsers = messages.stream().map(ChatMessage::getUserId).filter(Objects::nonNull).distinct().count();
        result.put("ai", Map.of("userCount", aiUsers, "messageCount", messages.size(),
                "fallbackCount", fallbackCount, "fallbackRate", rate(fallbackCount, aiReplyCount)));
        return result;
    }

    public Map<String, Object> pay(LocalDate begin, LocalDate end) {
        accessService.require(AdminAccessService.ALL, "当前角色无统计查看权限");
        Range range = range(begin, end);
        List<BizOrder> orders = orders(range);
        List<BizOrder> paid = orders.stream().filter(order -> List.of("paid", "opened").contains(order.getStatus())).toList();
        List<RefundOrder> refunds = refundMapper.selectList(new LambdaQueryWrapper<RefundOrder>()
                .ge(RefundOrder::getCreatedAt, range.start()).lt(RefundOrder::getCreatedAt, range.endExclusive()));
        int gmvCent = paid.stream().mapToInt(order -> safe(order.getPaidCent())).sum();
        List<RefundOrder> successfulRefunds = refunds.stream()
                .filter(row -> List.of("approved", "auto").contains(row.getStatus())).toList();
        int refundCent = successfulRefunds.stream().mapToInt(row -> safe(row.getAmountCent())).sum();
        Map<String, Long> channels = paid.stream().collect(Collectors.groupingBy(
                order -> order.getPayChannel() == null ? "unknown" : order.getPayChannel(), Collectors.counting()));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderCount", orders.size()); result.put("paidOrderCount", paid.size());
        result.put("gmv", yuan(gmvCent));
        result.put("averageOrderValue", paid.isEmpty() ? null : averageYuan(gmvCent, paid.size()));
        result.put("refundCount", successfulRefunds.size()); result.put("refundAmount", yuan(refundCent));
        result.put("refundRate", rate(successfulRefunds.size(), paid.size()));
        result.put("channels", channels.entrySet().stream().map(entry -> Map.of("channel", entry.getKey(), "count", entry.getValue())).toList());
        return result;
    }

    public Map<String, Object> content(LocalDate begin, LocalDate end) {
        accessService.require(AdminAccessService.ALL, "当前角色无统计查看权限");
        Range range = range(begin, end);
        List<Trip> trips = tripMapper.selectList(new LambdaQueryWrapper<Trip>()
                .ge(Trip::getCreatedAt, range.start()).lt(Trip::getCreatedAt, range.endExclusive()));
        List<Map<String, Object>> boxes = trips.stream().collect(Collectors.groupingBy(
                        trip -> trip.getBoxName() == null ? "未知盲盒" : trip.getBoxName(), Collectors.counting()))
                .entrySet().stream().map(entry -> metric("name", entry.getKey(), entry.getValue())).toList();
        List<Map<String, Object>> routes = trips.stream().collect(Collectors.groupingBy(
                        trip -> trip.getRouteName() == null ? "未知线路" : trip.getRouteName(), Collectors.counting()))
                .entrySet().stream().map(entry -> metric("name", entry.getKey(), entry.getValue())).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("openCount", trips.size()); result.put("boxStats", boxes); result.put("routeStats", routes);
        return result;
    }

    private Range range(LocalDate begin, LocalDate end) {
        LocalDate effectiveEnd = end == null ? LocalDate.now() : end;
        LocalDate effectiveBegin = begin == null ? effectiveEnd.minusDays(6) : begin;
        if (effectiveBegin.isAfter(effectiveEnd)) throw new BusinessException(400, "开始日期不能晚于结束日期");
        return new Range(effectiveBegin.atStartOfDay(), effectiveEnd.plusDays(1).atStartOfDay());
    }

    private List<BizOrder> orders(Range range) {
        return orderMapper.selectList(new LambdaQueryWrapper<BizOrder>()
                .ge(BizOrder::getCreatedAt, range.start()).lt(BizOrder::getCreatedAt, range.endExclusive()));
    }
    private static long paidCount(List<BizOrder> orders) { return orders.stream().filter(o -> List.of("paid", "opened", "refunded").contains(o.getStatus())).count(); }
    private static long openedCount(List<BizOrder> orders) { return orders.stream().filter(o -> "opened".equals(o.getStatus())).count(); }
    private static boolean inRange(LocalDateTime value, Range range) { return value != null && !value.isBefore(range.start()) && value.isBefore(range.endExclusive()); }
    private static Map<String, Object> funnel(String key, String label, Long count, BigDecimal rate) {
        Map<String, Object> value = new LinkedHashMap<>(); value.put("key", key); value.put("label", label); value.put("count", count); value.put("rate", rate); return value;
    }
    private static Map<String, Long> distribution(List<String> values) { return values.stream().filter(Objects::nonNull).collect(Collectors.groupingBy(v -> v, Collectors.counting())); }
    private static Map<String, Long> titleDistribution(List<AppUser> users, List<Trip> validTrips) {
        Map<Long, Long> tripsByUser = validTrips.stream().filter(trip -> trip.getUserId() != null)
                .collect(Collectors.groupingBy(Trip::getUserId, Collectors.counting()));
        Map<String, Long> value = new LinkedHashMap<>();
        value.put("旅行新手", 0L); value.put("探索者", 0L); value.put("旅行家", 0L);
        for (AppUser user : users) {
            long count = tripsByUser.getOrDefault(user.getId(), 0L);
            String title = count >= 8 ? "旅行家" : count >= 3 ? "探索者" : "旅行新手";
            value.computeIfPresent(title, (key, current) -> current + 1);
        }
        return value;
    }
    private static Map<String, Object> metric(String key, String value, long count) { Map<String, Object> item = new LinkedHashMap<>(); item.put(key, value); item.put("count", count); return item; }
    private static int safe(Integer value) { return value == null ? 0 : value; }
    private static BigDecimal yuan(int cents) { return BigDecimal.valueOf(cents).movePointLeft(2).setScale(2, RoundingMode.HALF_UP); }
    private static BigDecimal averageYuan(int cents, int count) {
        return BigDecimal.valueOf(cents).movePointLeft(2).divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }
    private static BigDecimal rate(long part, long total) { return total == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(part * 100.0 / total).setScale(2, RoundingMode.HALF_UP); }
    private record Range(LocalDateTime start, LocalDateTime endExclusive) { }
}
