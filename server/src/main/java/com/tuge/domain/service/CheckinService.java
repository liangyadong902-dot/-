package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.dto.CheckinRequest;
import com.tuge.domain.entity.Checkin;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.CheckinMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.CheckinVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class CheckinService {
    private final CheckinMapper checkinMapper;
    private final TripMapper tripMapper;
    private final ObjectMapper objectMapper;

    public CheckinService(CheckinMapper checkinMapper, TripMapper tripMapper, ObjectMapper objectMapper) {
        this.checkinMapper = checkinMapper;
        this.tripMapper = tripMapper;
        this.objectMapper = objectMapper;
    }

    public PageResult<CheckinVO> list(Long userId, long page, long pageSize) {
        Page<Checkin> result = new Page<>(Math.max(1, page), Math.min(100, Math.max(1, pageSize)));
        Page<Checkin> rows = checkinMapper.selectPage(result, new LambdaQueryWrapper<Checkin>()
                .eq(Checkin::getUserId, userId).orderByDesc(Checkin::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(this::toVO).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public CheckinVO detail(Long userId, Long id) {
        Checkin row = checkinMapper.selectOne(new LambdaQueryWrapper<Checkin>()
                .eq(Checkin::getId, id).eq(Checkin::getUserId, userId));
        if (row == null) throw new BusinessException(404, "打卡不存在");
        return toVO(row);
    }

    @Transactional
    public CheckinVO create(Long userId, CheckinRequest request) {
        Trip trip = tripMapper.selectOne(new LambdaQueryWrapper<Trip>()
                .eq(Trip::getId, request.tripId()).eq(Trip::getUserId, userId));
        if (trip == null || !"valid".equals(trip.getValidity())) {
            throw new BusinessException(409, "只能为本人有效行程打卡");
        }
        Checkin existing = checkinMapper.selectOne(new LambdaQueryWrapper<Checkin>()
                .eq(Checkin::getUserId, userId).eq(Checkin::getTripId, request.tripId()));
        if (existing != null) throw new BusinessException(409, "该行程已经打卡");
        Checkin row = new Checkin();
        row.setUserId(userId);
        row.setTripId(trip.getId());
        row.setRouteId(trip.getRouteId());
        row.setLocation(request.location() == null ? trip.getLocation() : request.location().trim());
        row.setLatitude(request.latitude());
        row.setLongitude(request.longitude());
        row.setPhotoUrl(writePhotos(request.photoUrls()));
        row.setNote(request.note());
        row.setSharePosterUrl(request.sharePosterUrl());
        row.setLikeCount(0);
        checkinMapper.insert(row);
        return toVO(row);
    }

    private String writePhotos(List<String> photos) {
        if (photos == null || photos.isEmpty()) return null;
        if (photos.size() > 9) throw new BusinessException(400, "最多上传 9 张图片");
        if (photos.stream().anyMatch(url -> url == null || !url.startsWith("https://"))) {
            throw new BusinessException(400, "图片必须使用 HTTPS 地址");
        }
        try { return objectMapper.writeValueAsString(photos); }
        catch (Exception e) { throw new BusinessException(400, "图片格式无效"); }
    }

    private CheckinVO toVO(Checkin row) {
        CheckinVO vo = new CheckinVO();
        vo.setId(row.getId()); vo.setUserId(row.getUserId()); vo.setTripId(row.getTripId());
        vo.setRouteId(row.getRouteId()); vo.setLocation(row.getLocation());
        vo.setLatitude(row.getLatitude()); vo.setLongitude(row.getLongitude());
        vo.setPhotoUrls(readPhotos(row.getPhotoUrl())); vo.setNote(row.getNote());
        vo.setSharePosterUrl(row.getSharePosterUrl()); vo.setLikeCount(row.getLikeCount());
        vo.setCreatedAt(row.getCreatedAt());
        return vo;
    }

    private List<String> readPhotos(String value) {
        if (value == null || value.isBlank()) return Collections.emptyList();
        try { return objectMapper.readValue(value, new TypeReference<>() {}); }
        catch (Exception e) { return List.of(value); }
    }
}
