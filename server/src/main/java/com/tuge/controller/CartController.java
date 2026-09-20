package com.tuge.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tuge.common.exception.BusinessException;
import com.tuge.common.jwt.JwtContext;
import com.tuge.common.result.PageResult;
import com.tuge.common.result.Result;
import com.tuge.domain.dto.CreateOrderRequest;
import com.tuge.domain.entity.BlindBox;
import com.tuge.domain.entity.CartItem;
import com.tuge.domain.mapper.BlindBoxMapper;
import com.tuge.domain.mapper.CartItemMapper;
import com.tuge.domain.service.OrderService;
import com.tuge.domain.vo.OrderVO;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {
    private final CartItemMapper cartMapper;
    private final BlindBoxMapper boxMapper;
    private final OrderService orderService;

    public CartController(CartItemMapper cartMapper, BlindBoxMapper boxMapper, OrderService orderService) {
        this.cartMapper = cartMapper; this.boxMapper = boxMapper; this.orderService = orderService;
    }

    @GetMapping("/items")
    public Result<PageResult<Map<String, Object>>> list() {
        Long userId = user(); List<CartItem> rows = cartMapper.selectList(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId).orderByDesc(CartItem::getCreatedAt));
        List<Map<String, Object>> items = rows.stream().map(this::item).toList(); return Result.success(PageResult.of(items, items.size(), 1, Math.max(1, items.size())));
    }

    @PostMapping("/items")
    public Result<Map<String, Object>> add(@RequestBody Map<String, Object> body) {
        Long userId = user(); Long boxId = longValue(body.get("boxId")); int quantity = Math.max(1, Math.min(10, intValue(body.get("quantity"), 1))); BlindBox box = boxMapper.selectById(boxId); if (box == null) throw new BusinessException(404, "盲盒不存在");
        CartItem existing = cartMapper.selectOne(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId).eq(CartItem::getBoxId, boxId));
        if (existing == null) { existing = new CartItem(); existing.setUserId(userId); existing.setBoxId(boxId); existing.setQuantity(quantity); existing.setSelected(1); existing.setVersion(0); try { cartMapper.insert(existing); } catch (DuplicateKeyException e) { existing = cartMapper.selectOne(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId).eq(CartItem::getBoxId, boxId)); } }
        else { existing.setQuantity(Math.min(10, existing.getQuantity() + quantity)); cartMapper.updateById(existing); }
        Map<String, Object> result = new LinkedHashMap<>(); result.put("itemId", existing.getId()); result.put("quantity", existing.getQuantity()); result.put("cartCount", cartMapper.selectCount(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId))); return Result.success(result);
    }

    @PatchMapping("/items/{id}")
    public Result<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = user(); CartItem item = find(userId, id); if (body.containsKey("version") && intValue(body.get("version"), -1) != item.getVersion()) throw new BusinessException(409, "购物车已在其他设备更新"); if (body.containsKey("quantity")) item.setQuantity(Math.max(1, Math.min(10, intValue(body.get("quantity"), item.getQuantity())))); if (body.containsKey("selected")) item.setSelected(Boolean.TRUE.equals(body.get("selected")) || "true".equals(body.get("selected")) ? 1 : 0); item.setVersion(item.getVersion() + 1); cartMapper.updateById(item); return Result.success(item(item));
    }

    @DeleteMapping("/items/{id}") public Result<Map<String, Object>> remove(@PathVariable Long id) { Long userId = user(); cartMapper.delete(new LambdaQueryWrapper<CartItem>().eq(CartItem::getId, id).eq(CartItem::getUserId, userId)); return Result.success(Map.of("cartCount", cartMapper.selectCount(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId)))); }
    @DeleteMapping("/items") public Result<Map<String, Object>> clear(@RequestParam(defaultValue = "false") boolean selectedOnly) { Long userId = user(); cartMapper.delete(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId).eq(selectedOnly, CartItem::getSelected, 1)); return Result.success(Map.of("cartCount", cartMapper.selectCount(new LambdaQueryWrapper<CartItem>().eq(CartItem::getUserId, userId)))); }

    @PostMapping("/checkout")
    @Transactional
    public Result<Map<String, Object>> checkout(@RequestBody Map<String, Object> body) {
        Long userId = user(); Object raw = body.get("itemIds"); if (!(raw instanceof List<?> ids)) throw new BusinessException(400, "请选择购物车商品"); List<Map<String, Object>> orders = new ArrayList<>(); List<Map<String, Object>> failed = new ArrayList<>();
        for (Object value : ids) { try { CartItem item = find(userId, longValue(value)); BlindBox box = boxMapper.selectById(item.getBoxId()); if (box == null || !"on".equals(box.getStatus())) throw new BusinessException(409, "商品已失效"); OrderVO order = orderService.create(userId, new CreateOrderRequest(box.getId())); orders.add(Map.of("itemId", item.getId(), "orderNo", order.getOrderNo(), "amount", BigDecimal.valueOf(order.getPriceCent()).movePointLeft(2), "expireAt", order.getExpireAt())); cartMapper.deleteById(item.getId()); } catch (Exception e) { failed.add(Map.of("itemId", value, "reason", e.getMessage() == null ? "无法结算" : e.getMessage())); } }
        return Result.success(Map.of("orders", orders, "failedItems", failed));
    }

    private Map<String, Object> item(CartItem item) { BlindBox box = boxMapper.selectById(item.getBoxId()); Map<String, Object> boxData = new LinkedHashMap<>(); if (box != null) { boxData.put("id", box.getId()); boxData.put("name", box.getName()); boxData.put("coverUrl", box.getCoverUrl()); boxData.put("price", BigDecimal.valueOf(box.getPriceCent()).movePointLeft(2)); boxData.put("minValue", BigDecimal.valueOf(box.getMinValueCent()).movePointLeft(2)); boxData.put("status", box.getStatus()); } Map<String, Object> result = new LinkedHashMap<>(); result.put("itemId", item.getId()); result.put("box", boxData); result.put("quantity", item.getQuantity()); result.put("selected", item.getSelected() == 1); result.put("subtotal", box == null ? BigDecimal.ZERO : BigDecimal.valueOf((long) box.getPriceCent() * item.getQuantity()).movePointLeft(2)); result.put("invalidReason", box == null ? "商品不存在" : ("on".equals(box.getStatus()) ? null : "商品已下架")); result.put("version", item.getVersion()); result.put("createdAt", item.getCreatedAt()); return result; }
    private CartItem find(Long userId, Long id) { CartItem item = cartMapper.selectOne(new LambdaQueryWrapper<CartItem>().eq(CartItem::getId, id).eq(CartItem::getUserId, userId)); if (item == null) throw new BusinessException(404, "购物车商品不存在"); return item; }
    private Long user() { Long id = JwtContext.getUserId(); if (id == null) throw new BusinessException(401, "请先登录"); return id; }
    private Long longValue(Object value) { if (value == null) throw new BusinessException(400, "参数不能为空"); return Long.valueOf(String.valueOf(value)); }
    private int intValue(Object value, int fallback) { try { return value == null ? fallback : Integer.parseInt(String.valueOf(value)); } catch (NumberFormatException e) { return fallback; } }
}
