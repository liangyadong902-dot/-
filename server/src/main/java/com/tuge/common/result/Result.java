package com.tuge.common.result;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

/**
 * 统一响应体
 *
 * <pre>{@code
 * { "code": 0, "message": "success", "data": {} }
 * }</pre>
 *
 * @param <T> 数据类型
 */
@Data
public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 业务状态码，0 表示成功 */
    private int code;
    /** 提示信息 */
    private String message;
    /** 业务数据 */
    private T data;
    private String requestId;

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.setCode(0);
        r.setMessage("success");
        r.setData(data);
        r.setRequestId(UUID.randomUUID().toString());
        return r;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(int code, String message) {
        Result<T> r = new Result<>();
        r.setCode(code);
        r.setMessage(message);
        r.setRequestId(UUID.randomUUID().toString());
        return r;
    }
}
