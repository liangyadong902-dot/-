package com.tuge.common.biz;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

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
        return prefix + date + String.format("%06d", getDailySequence(prefix, date));
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
