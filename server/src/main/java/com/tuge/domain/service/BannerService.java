package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.domain.entity.Banner;
import com.tuge.domain.mapper.BannerMapper;
import com.tuge.domain.vo.BannerVO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户端运营位（阶段一：当前有效 Banner）
 */
@Service
public class BannerService {

    private final BannerMapper bannerMapper;

    public BannerService(BannerMapper bannerMapper) {
        this.bannerMapper = bannerMapper;
    }

    /**
     * status=on 且在投放窗口内，按权重倒序
     */
    public List<BannerVO> listActive() {
        LocalDateTime now = LocalDateTime.now();
        List<Banner> rows = bannerMapper.selectList(
                new LambdaQueryWrapper<Banner>()
                        .eq(Banner::getStatus, "on")
                        .and(w -> w.isNull(Banner::getStartAt).or().le(Banner::getStartAt, now))
                        .and(w -> w.isNull(Banner::getEndAt).or().ge(Banner::getEndAt, now))
                        .orderByDesc(Banner::getSortWeight)
                        .orderByAsc(Banner::getId));
        return rows.stream().map(this::toVO).toList();
    }

    private BannerVO toVO(Banner row) {
        BannerVO vo = new BannerVO();
        vo.setId(row.getId());
        vo.setTitle(row.getTitle());
        vo.setSubTitle(row.getSubtitle());
        vo.setTag(row.getTagText());
        vo.setImageUrl(row.getImageUrl());
        vo.setJumpType(row.getJumpType());
        vo.setJumpTarget(row.getJumpValue());
        return vo;
    }
}
