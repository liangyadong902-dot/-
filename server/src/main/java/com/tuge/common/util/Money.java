package com.tuge.common.util;

/**
 * 分 / 元换算，只出现在适配层。
 */
public final class Money {

    private Money() {
    }

    public static double yuan(Integer cent) {
        if (cent == null) {
            return 0;
        }
        return cent / 100.0;
    }

    public static int cent(Number yuan) {
        if (yuan == null) {
            return 0;
        }
        return (int) Math.round(yuan.doubleValue() * 100);
    }
}
