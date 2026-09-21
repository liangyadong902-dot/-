package com.tuge.common.biz;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 业务单号：前缀 + yyyyMMdd + 6 位日序（Redis INCR）
 */
@Component
public class BizNoGenerator {

    private static final DateTimeFormatter DAY = DateTimeFormatter.BASIC_ISO_DATE;

    private final StringRedisTemplate redisTemplate;

    public BizNoGenerator(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generate(String prefix) {
        String date = LocalDate.now().format(DAY);
        try {
            return prefix + date + String.format("%06d", getDailySequence(prefix, date));
        } catch (RuntimeException ignored) {
            // Redis 不可用时仍允许下单；UUID 后缀避免单机自增在重启后重复。
            return prefix + date + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
    }

    private long getDailySequence(String prefix, String date) {
        String key = String.format("seq:%s:%s", prefix, date);
        Long seq = redisTemplate.opsForValue().increment(key);
        if (seq != null && seq == 1L) {
            redisTemplate.expire(key, Duration.ofDays(2));
        }
        return seq != null ? seq : 1L;
    }
}
