package com.tuge.common.exception;

/**
 * 业务异常
 *
 * <p>由 {@code GlobalExceptionHandler} 统一捕获，转为统一响应体。</p>
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message) {
        this(400, message);
    }

    public int getCode() {
        return code;
    }
}