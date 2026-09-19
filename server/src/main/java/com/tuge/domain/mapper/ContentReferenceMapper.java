package com.tuge.domain.mapper;

import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Param;

public interface ContentReferenceMapper {

    @Select("SELECT COUNT(*) FROM biz_order WHERE box_id = #{id} AND status IN ('pending_pay', 'paid')")
    long countActiveOrdersForBox(@Param("id") Long id);

    @Select("SELECT COUNT(*) FROM biz_order WHERE route_id = #{id}")
    long countOrdersForRoute(@Param("id") Long id);

    @Select("SELECT COUNT(*) FROM trip WHERE route_id = #{id}")
    long countTripsForRoute(@Param("id") Long id);
}
