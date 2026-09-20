package com.tuge.common.exception;

/**
 * 支付宝异步通知重复（notify_id 已存在）。幂等场景：调用方应直接回 success。
 */
public class DuplicateNotifyException extends RuntimeException {

    public DuplicateNotifyException() {
        super("重复的支付异步通知");
    }
}
