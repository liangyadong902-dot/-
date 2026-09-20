package com.tuge.domain.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.result.PageResult;
import com.tuge.domain.dto.CheckinCreateRequest;
import com.tuge.domain.entity.AppUser;
import com.tuge.domain.entity.Checkin;
import com.tuge.domain.entity.CheckinImage;
import com.tuge.domain.entity.CheckinLike;
import com.tuge.domain.entity.Trip;
import com.tuge.domain.mapper.AppUserMapper;
import com.tuge.domain.mapper.CheckinImageMapper;
import com.tuge.domain.mapper.CheckinLikeMapper;
import com.tuge.domain.mapper.CheckinMapper;
import com.tuge.domain.mapper.TripMapper;
import com.tuge.domain.vo.CheckinVO;
import com.tuge.domain.vo.SocialUserVO;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class CheckinService {
    private final CheckinMapper checkinMapper;
    private final CheckinImageMapper imageMapper;
    private final CheckinLikeMapper likeMapper;
    private final TripMapper tripMapper;
    private final AppUserMapper userMapper;
    private final AchievementService achievementService;

    public CheckinService(CheckinMapper checkinMapper, CheckinImageMapper imageMapper, CheckinLikeMapper likeMapper,
                          TripMapper tripMapper, AppUserMapper userMapper, AchievementService achievementService) {
        this.checkinMapper = checkinMapper; this.imageMapper = imageMapper; this.likeMapper = likeMapper;
        this.tripMapper = tripMapper; this.userMapper = userMapper; this.achievementService = achievementService;
    }

    public CheckinEligibility eligibility(Long userId, Long tripId) {
        Trip trip = tripMapper.selectById(tripId); CheckinEligibility result = new CheckinEligibility(); result.tripId = tripId;
        if (trip == null || !Objects.equals(trip.getUserId(), userId)) { result.eligible = false; result.reasonCode = "TRIP_NOT_FOUND"; result.reasonMessage = "行程不存在"; return result; }
        if (!"valid".equals(trip.getValidity())) { result.eligible = false; result.reasonCode = "TRIP_INVALID"; result.reasonMessage = "退款行程不可打卡"; return result; }
        Checkin existing = checkinMapper.selectOne(new LambdaQueryWrapper<Checkin>().eq(Checkin::getUserId, userId).eq(Checkin::getTripId, tripId));
        result.existingCheckinId = existing == null ? null : existing.getId(); result.eligible = existing == null; result.reasonCode = existing == null ? null : "ALREADY_CHECKED"; result.reasonMessage = existing == null ? null : "该行程已完成打卡"; return result;
    }

    @Transactional
    public CheckinResult create(Long userId, CheckinCreateRequest request) {
        if (userId == null) throw new BusinessException(401, "请先登录");
        Trip trip = tripMapper.selectById(request.tripId());
        if (trip == null || !Objects.equals(trip.getUserId(), userId)) throw new BusinessException(403, "只能为自己的行程打卡");
        if (!"valid".equals(trip.getValidity())) throw new BusinessException(409, "退款行程不可打卡");
        Checkin existing = checkinMapper.selectOne(new LambdaQueryWrapper<Checkin>().eq(Checkin::getUserId, userId).eq(Checkin::getTripId, request.tripId()));
        if (existing != null) return new CheckinResult(toVO(existing, userId), achievementService.check(userId));
        Checkin item = new Checkin(); item.setUserId(userId); item.setTripId(trip.getId()); item.setRouteId(trip.getRouteId()); item.setLocationName(request.locationName().trim()); item.setPublicLocation(Boolean.TRUE.equals(request.publicLocation()) ? 1 : 0); item.setLatitude(request.latitude()); item.setLongitude(request.longitude()); item.setNote(request.note()); item.setStatus("published"); item.setLikeCount(0); item.setVersion(0);
        try { checkinMapper.insert(item); } catch (DuplicateKeyException e) { existing = checkinMapper.selectOne(new LambdaQueryWrapper<Checkin>().eq(Checkin::getUserId, userId).eq(Checkin::getTripId, request.tripId())); return new CheckinResult(toVO(existing, userId), achievementService.check(userId)); }
        if (request.imageUrls() != null) for (int i = 0; i < request.imageUrls().size(); i++) { CheckinImage image = new CheckinImage(); image.setCheckinId(item.getId()); image.setUrl(request.imageUrls().get(i)); image.setSortOrder(i); imageMapper.insert(image); }
        return new CheckinResult(toVO(item, userId), achievementService.check(userId, "checkin", "checkin", item.getId()));
    }

    public PageResult<CheckinVO> list(Long userId, long page, long pageSize) {
        if (userId == null) throw new BusinessException(401, "请先登录");
        Page<Checkin> result = new Page<>(safePage(page), safeSize(pageSize)); Page<Checkin> rows = checkinMapper.selectPage(result, new LambdaQueryWrapper<Checkin>().eq(Checkin::getUserId, userId).ne(Checkin::getStatus, "deleted").orderByDesc(Checkin::getCreatedAt));
        return PageResult.of(rows.getRecords().stream().map(c -> toVO(c, userId)).toList(), rows.getTotal(), rows.getCurrent(), rows.getSize());
    }

    public CheckinVO detail(Long userId, Long id) { Checkin item = checkinMapper.selectById(id); if (item == null || "deleted".equals(item.getStatus()) || (!"published".equals(item.getStatus()) && !Objects.equals(item.getUserId(), userId))) throw new BusinessException(404, "打卡不存在"); return toVO(item, userId); }
    public CheckinVO adminView(Long id) { Checkin item = checkinMapper.selectById(id); if (item == null) throw new BusinessException(404, "打卡不存在"); return toVO(item, null); }

    @Transactional
    public CheckinVO setLike(Long userId, Long id, boolean active) { if (userId == null) throw new BusinessException(401, "请先登录"); Checkin item = checkinMapper.selectById(id); if (item == null || !"published".equals(item.getStatus())) throw new BusinessException(404, "打卡不可见"); CheckinLike existing = likeMapper.selectOne(new LambdaQueryWrapper<CheckinLike>().eq(CheckinLike::getCheckinId, id).eq(CheckinLike::getUserId, userId)); if (active && existing == null) { CheckinLike like = new CheckinLike(); like.setCheckinId(id); like.setUserId(userId); like.setCreatedAt(LocalDateTime.now()); try { likeMapper.insert(like); } catch (DuplicateKeyException ignored) {} } if (!active && existing != null) likeMapper.deleteById(existing.getId()); item.setLikeCount(Math.toIntExact(likeMapper.selectCount(new LambdaQueryWrapper<CheckinLike>().eq(CheckinLike::getCheckinId, id)))); checkinMapper.updateById(item); return toVO(item, userId); }

    public List<CheckinVO> ranking(String period) { List<Checkin> items = checkinMapper.selectList(new LambdaQueryWrapper<Checkin>().eq(Checkin::getStatus, "published").orderByDesc(Checkin::getLikeCount).last("LIMIT 50")); return items.stream().map(c -> toVO(c, null)).toList(); }

    @Transactional
    public CheckinVO poster(Long userId, Long id) { Checkin item = checkinMapper.selectById(id); if (item == null || !Objects.equals(item.getUserId(), userId)) throw new BusinessException(403, "只能生成自己的打卡海报"); if (item.getPosterUrl() == null) { List<CheckinImage> images = imageMapper.selectList(new LambdaQueryWrapper<CheckinImage>().eq(CheckinImage::getCheckinId, id).orderByAsc(CheckinImage::getSortOrder)); if (!images.isEmpty()) { item.setPosterUrl(images.get(0).getUrl()); checkinMapper.updateById(item); } } return toVO(item, userId); }

    private CheckinVO toVO(Checkin item, Long currentUserId) { CheckinVO vo = new CheckinVO(); vo.setCheckinId(item.getId()); vo.setTripId(item.getTripId()); vo.setRouteId(item.getRouteId()); vo.setLocationName(item.getLocationName()); vo.setPublicLocation(item.getPublicLocation() != null && item.getPublicLocation() == 1); vo.setImageUrls(imageMapper.selectList(new LambdaQueryWrapper<CheckinImage>().eq(CheckinImage::getCheckinId, item.getId()).orderByAsc(CheckinImage::getSortOrder)).stream().map(CheckinImage::getUrl).toList()); vo.setNote(item.getNote()); vo.setPosterUrl(item.getPosterUrl()); vo.setLikeCount(item.getLikeCount() == null ? 0 : item.getLikeCount()); vo.setLiked(currentUserId != null && likeMapper.selectCount(new LambdaQueryWrapper<CheckinLike>().eq(CheckinLike::getCheckinId, item.getId()).eq(CheckinLike::getUserId, currentUserId)) > 0); vo.setStatus(item.getStatus()); vo.setVersion(item.getVersion()); vo.setCreatedAt(item.getCreatedAt()); AppUser user = userMapper.selectById(item.getUserId()); SocialUserVO author = new SocialUserVO(); if (user != null) { author.setUserId(user.getId()); author.setNickname(user.getNickname()); author.setAvatarUrl(user.getAvatarUrl()); author.setCity(user.getCity()); } vo.setUser(author); return vo; }
    private long safePage(long v) { return Math.max(1, v); }
    private long safeSize(long v) { return Math.min(100, Math.max(1, v)); }
    public static class CheckinEligibility { public Long tripId; public boolean eligible; public String reasonCode; public String reasonMessage; public Long existingCheckinId; public Long getTripId(){return tripId;} public boolean isEligible(){return eligible;} public String getReasonCode(){return reasonCode;} public String getReasonMessage(){return reasonMessage;} public Long getExistingCheckinId(){return existingCheckinId;} }
    public record CheckinResult(CheckinVO checkin, List<com.tuge.domain.vo.AchievementVO> newlyUnlocked) {}
}
