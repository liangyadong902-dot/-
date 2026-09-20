package com.tuge.common.result;

import lombok.Data;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * 分页响应体
 *
 * @param <T> 列表元素类型
 */
@Data
public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<T> list;
    private long total;
    private long page;
    private long pageSize;

    public boolean isHasMore() {
        return page * pageSize < total;
    }

    public static <T> PageResult<T> of(List<T> list, long total, long page, long pageSize) {
        PageResult<T> r = new PageResult<>();
        r.setList(list == null ? Collections.emptyList() : list);
        r.setTotal(total);
        r.setPage(page);
        r.setPageSize(pageSize);
        return r;
    }
}
