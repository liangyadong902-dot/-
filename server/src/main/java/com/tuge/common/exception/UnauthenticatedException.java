package com.tuge.common.exception;

/**
 * 未登录 / 登录过期异常，HTTP 语义对应 401。
 */
public class UnauthenticatedException extends RuntimeException {

    public UnauthenticatedException() {
        super("未登录或登录已过期");
    }

    public UnauthenticatedException(String message) {
        super(message);
    }
}