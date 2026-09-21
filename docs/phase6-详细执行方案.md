# 阶段六：积分、优惠券与奖励执行方案

## 1. 范围冻结

阶段六不新增、不开发、不验收商家能力。

明确排除：

- 商家新增、编辑、审核、启停。
- 商家管理端页面和商家 API。
- 商家统计、佣金、结算。
- 独立商家账号或商家角色。
- 跨商家核销校验。
- 商家扫码核销。

现有 `partner` 表、旧数据和 `coupon.partner_id` 字段保留，避免影响既有阶段；但阶段六新增和兑换的优惠券统一为平台券，`partnerId=null`。阶段六不读取或写入商家信息，旧商家数据不纳入验收。

本阶段只交付：

- 平台优惠券模板。
- 用户卡包。
- 用户自助使用优惠券。
- 用户积分账户和流水。
- 每日签到。
- 积分商城优惠券兑换。
- 盲盒优惠券奖品实例。
- 成就积分/优惠券奖励联动。
- 优惠券、积分和兑换的管理端页面。
- 审计、幂等、库存和余额保护。

## 2. 最终接口

### 用户端

```text
GET  /api/v1/me/coupons?status=unused|used|expired&page&pageSize
GET  /api/v1/me/coupons/{id}
POST /api/v1/me/coupons/{id}/use

GET  /api/v1/me/points
GET  /api/v1/me/points/history?type&page&pageSize
POST /api/v1/me/signin

GET  /api/v1/points/items
POST /api/v1/points/exchange

GET  /api/v1/prizes/{id}
```

优惠券详情只返回：

- 券名称、优惠内容、使用门槛。
- 有效期、券号、核销码。
- 来源、状态、使用说明。

不返回商家对象、商家名称或商家地址。

### 管理端

```text
GET/POST  /api/v1/admin/coupons
GET/PUT   /api/v1/admin/coupons/{id}
PATCH     /api/v1/admin/coupons/{id}/status
GET       /api/v1/admin/coupons/{id}/records
POST      /api/v1/admin/coupons/{id}/grant

GET/POST  /api/v1/admin/points/items
PUT       /api/v1/admin/points/items/{id}
DELETE    /api/v1/admin/points/items/{id}
GET/PUT   /api/v1/admin/points/rules
GET       /api/v1/admin/points/statistics
GET       /api/v1/admin/points/ranking
```

阶段六不实现：

```text
/api/v1/admin/partners/*
/api/v1/points/tasks
/api/v1/admin/redemptions/*
/api/v1/admin/rewards/*
```

统一使用 camelCase 字段；不兼容旧的 `/issue` 路径，人工发券统一使用 `/grant`。

## 3. 通用契约和权限

- API 使用 `{ code, message, data }` 响应封装。
- 分页使用 `{ list, total, page, pageSize }`。
- 数据库字段使用 snake_case，接口字段使用 camelCase。
- `401` 表示未登录，`403` 表示越权，`404` 表示资源不存在，`409` 表示状态冲突，`422` 表示积分、库存或业务规则不足。
- 所有当前用户 ID 从 `JwtContext` 获取，客户端不能提交用户 ID 代替身份。
- 统计查询允许全部管理角色。
- 优惠券、积分商品和积分规则写入允许 `super_admin`、`operator`。
- 人工发券允许 `super_admin`、`operator`。
- MVP 不开放人工调分和核销冲正。
- 服务端使用现有 `AdminAccessService` 二次校验，前端隐藏按钮不作为安全控制。

## 4. 数据模型和业务规则

### 4.1 状态冻结

```text
coupon:               on | off
user_coupon:          unused | used | expired
coupon_redemption:    redeemed
user_prize:           granted | failed
point_exchange_order: completed | failed
```

MVP 不引入 `locked`、`reversed`、`reserved` 等异步状态，所有扣库存、扣积分和发券在一个数据库事务内完成。

### 4.2 新增表

1. `coupon_redemption`

   - `redemption_no` 唯一。
   - `user_coupon_id` 唯一，确保一张券只能成功使用一次。
   - 保存 `coupon_id`、`user_id`、`verify_code`、`verified_at`。
   - `order_id` 保留为空，后续阶段再接订单。
   - 不增加 `partner_id`。

2. `user_prize`

   - 保存 `grant_no`、`grant_key`、`user_id`、`order_id`、`blind_box_prize_id`、`prize_type`、`coupon_id`、`user_coupon_id`、`status` 和 `failure_reason`。
   - `grant_key` 唯一，格式为 `order:{orderId}:prize:{index}`。

3. `user_signin`

   - 主键为 `(user_id, signin_date)`。
   - 保存 `points_earned`、`consecutive_days`。
   - 日期统一按北京时间计算。

4. `point_item`

   - MVP 只支持 `item_type=coupon`。
   - 保存 `coupon_id`、`points_cost`、`stock`、`remain_stock`、`limit_per_user`、`status`、`start_at`、`end_at`。

5. `point_exchange_order`

   - 保存 `exchange_no`、`user_id`、`item_id`、`points_cost`、`status`、`user_coupon_id` 和 `failure_reason`。
   - 状态只使用 `completed`、`failed`。

### 4.3 既有表补充字段

- `user_coupon`：`coupon_no`、`verify_code`、`grant_request_id`。
- `user_point`：`version`。
- `point_log`：`request_id`、`source_type`、`source_id`。
- `achievement.reward_type` 增加 `points`。

阶段六新增的所有优惠券记录必须使用 `partner_id=null`。旧商家券可以保留，但不进入阶段六页面和测试数据。

修改 [schema.sql](./schema.sql)、[seed.sql](./seed.sql) 和 [openapi.yaml](./openapi.yaml) 时，必须同步提供增量 SQL 和回滚说明。

## 5. 后端执行顺序

### 5.1 统一发券服务

新增 `CouponGrantService`，统一处理：

- 管理端发券。
- 积分兑换发券。
- 盲盒优惠券奖品。
- 成就优惠券奖励。

事务流程：

1. 校验平台券模板和券状态。
2. 校验用户限领。
3. 条件扣减 `remain_count`。
4. 生成不可预测的 `couponNo` 和 `verifyCode`。
5. 写入 `user_coupon`。
6. 写入来源和幂等键。
7. 任一步失败则回滚整笔事务。

管理端发券请求只接受 `userIds`，最多 100 个用户，不实现随机发放数量。

### 5.2 统一积分服务

积分来源只包含：

- 每日签到。
- 成就奖励。
- 积分商城兑换扣减。

不实现订单消费积分、打卡积分、点赞积分和积分任务。

账户更新、流水写入和幂等校验必须在同一事务中完成。签到幂等键为 `userId + signinDate`；成就幂等键为 `userId + achievementId`；兑换使用 `Idempotency-Key`。

### 5.3 优惠券使用

`POST /me/coupons/{id}/use` 由当前用户发起：

- 只能使用自己的券。
- 校验券状态、有效期和核销码。
- 条件更新 `unused -> used`。
- 写入一条 `coupon_redemption`。
- 重复请求返回原核销结果。
- 不实现商家扫码、跨商家校验和冲正。

### 5.4 盲盒和成就

- 开盒成功后调用 `PrizeGrantService`。
- 优惠券奖品创建 `user_prize`，再调用统一发券服务。
- 发券失败保留 `failed` 状态和失败原因。
- 成就奖励先条件更新 `reward_sent=0 -> 1`，再调用积分或发券服务。
- 重复开盒和重复成就事件不得重复产生奖励。

## 6. 三端任务安排

| 工作日 | 后端 | 小程序 | 管理端 |
|---|---|---|---|
| 1 | 冻结范围、状态、权限和接口 | 盘点卡包/积分页面状态 | 盘点优惠券/积分页面状态 |
| 2 | 更新 OpenAPI、DDL、seed | API mock | API mock |
| 3 | 新表、索引、reset、seed | API 封装 | API 封装 |
| 4 | 统一发券和积分账户 | 页面骨架 | 页面骨架 |
| 5 | 卡包和积分用户 API | 卡包列表、详情 | 优惠券列表 |
| 6 | 平台券 CRUD、库存和发券 | 卡包筛选、空态、错误态 | 优惠券 CRUD、发券 |
| 7 | 签到和流水 | 积分中心、签到 | 券领取/使用记录 |
| 8 | 积分商品和兑换 | 积分商城、兑换结果 | 积分商品管理 |
| 9 | 用户奖品实例 | 开盒奖品展示 | 暂不新增奖品页面 |
| 10 | 成就奖励联动 | 奖励结果刷新 | 积分规则页面 |
| 11 | 统计和排行 | 联调修复 | 积分统计、排行 |
| 12 | 用券、审计、权限 | 使用确认和结果页 | 权限和错误态 |
| 13 | 并发、回滚、全链路测试 | 真机回归 | 桌面回归 |
| 14 | 发布检查和交接 | 原型对照 | 原型对照 |

第 3 天前只允许使用 mock；统一发券和积分服务完成后，才接入兑换、奖品和成就。

## 7. 验收标准

必须通过：

- 卡包可展示平台优惠券，并按未使用、已使用、已过期筛选。
- 每日签到重复提交只产生一次积分。
- 积分商城只展示可履约的平台优惠券。
- 积分兑换后自动进入卡包。
- 开盒优惠券进入卡包，重复开盒不重复发放。
- 管理端可创建、上下架和向指定用户发放平台券。
- 管理端可查看积分发放、消耗、签到和兑换统计。
- 成就奖励可发积分或平台券，重复事件不重复奖励。
- 并发发券不超过券库存。
- 并发兑换不超过商品库存或积分余额。
- 同一张券不能成功使用两次。
- 非本人卡包、奖品和积分接口返回 `403`。
- `schema.sql` 和 `seed.sql` 可重复执行。
- seed 包含平台券、用户券、积分账户、签到、兑换单、用户奖品和失败案例。
- `mvn test -q`、管理端构建和小程序 JS 语法检查通过。

### 自动检查

```bash
cd server && mvn test -q
cd admin-web && npm run build
find miniapp -name '*.js' -print0 | xargs -0 -n1 node --check
```

另外执行 50 并发签到、50 并发发券、50 并发兑换和 50 并发用券测试，检查余额、库存、唯一键和流水对账结果。

## 8. 发布和回滚

- 保留现有 `partner` 表和旧数据，不删除、不迁移。
- 阶段六只新增表、字段、索引和平台券 seed。
- 开发环境使用更新后的 schema/reset。
- 已有数据库使用单独的增量 SQL，不直接执行全量 DROP。
- 上线前备份 `coupon`、`user_coupon`、`user_point` 和 `point_log`。
- 回滚时停止新接口和新页面，不删除已经产生的积分、用户券、兑换单和核销记录。

## 9. 默认假设

- 阶段五已提供可重复消费的成就解锁入口；如果没有，先补一个持久化成就奖励事件。
- 盲盒奖品只优先履约优惠券类型，实物奖品继续显示为未实现或后置。
- 积分来源只包含签到和成就，订单消费、打卡、点赞等来源后置。
- 阶段六不新增小程序 Tab，入口放在“我的”、开盒结果和成就结果页。
- 视觉验收以现有设计 Token 为基准；如果没有阶段六页面原型，先补最小页面线框和状态清单，再开始页面验收。

## 10. API 具体契约

### 10.1 请求约定

- 所有写操作使用 `Content-Type: application/json`。
- 用户接口从 JWT 获取 `userId`，请求体不得出现 `userId` 字段。
- 管理端发券、积分兑换、优惠券使用均支持 `Idempotency-Key`。
- `POST /me/signin` 不要求客户端生成幂等键，服务端使用 `userId + 北京日期` 生成确定性键。
- `page` 默认 `1`，`pageSize` 默认 `20`，最大 `50`；超出范围返回 `400`。
- API 金额字段使用元（最多两位小数），数据库金额字段使用整数分；积分字段使用非负整数。
- 时间字段统一为 `yyyy-MM-dd HH:mm:ss`，服务端按北京时间序列化。

### 10.2 业务错误码

| HTTP | code | 使用场景 |
|---:|---|---|
| 400 | `INVALID_PARAM` | 参数格式、分页或枚举值错误 |
| 401 | `UNAUTHENTICATED` | JWT 缺失或已过期 |
| 403 | `FORBIDDEN` | 访问他人资产或管理端越权 |
| 404 | `NOT_FOUND` | 券、奖品、积分商品不存在 |
| 409 | `IDEMPOTENT_REPLAY` | 同一请求键对应的业务结果已存在 |
| 409 | `INVALID_STATUS` | 当前状态不允许执行该动作 |
| 422 | `COUPON_EXPIRED` | 优惠券已过期 |
| 422 | `COUPON_SOLD_OUT` | 优惠券库存不足 |
| 422 | `POINTS_INSUFFICIENT` | 积分余额不足 |
| 422 | `POINT_ITEM_SOLD_OUT` | 积分商品库存不足 |
| 422 | `USER_LIMIT_REACHED` | 用户超过领取或兑换限制 |

### 10.3 用户接口数据结构

#### `GET /me/coupons`

查询参数：`status`、`page`、`pageSize`。

列表项固定字段：

```json
{
  "id": 1001,
  "couponId": 10,
  "name": "新手旅行券",
  "type": "deduction",
  "discountAmount": 10.00,
  "minOrderAmount": 0,
  "validUntil": "2026-10-20 23:59:59",
  "status": "unused",
  "source": "achievement"
}
```

服务端查询时将 `status=unused` 且 `validUntil < now` 的记录统一作为 `expired` 返回；不得依赖前端计算状态。

#### `GET /me/coupons/{id}`

返回列表项全部字段，并追加：

```json
{
  "couponNo": "UC202609200001",
  "verifyCode": "8Q7K2M9P",
  "obtainedAt": "2026-09-20 10:00:00",
  "usedAt": null,
  "usageGuide": "仅限平台指定订单使用"
}
```

接口必须先按 `id + JwtContext.userId` 查询，不能先查券再判断用户归属。

#### `POST /me/coupons/{id}/use`

请求体为空。成功返回：

```json
{
  "redemptionNo": "RD202609200001",
  "status": "redeemed",
  "usedAt": "2026-09-20 10:05:00",
  "verifyCode": "8Q7K2M9P"
}
```

重复请求返回同一 `redemptionNo`，不得新建核销记录。过期、已使用和不存在的券分别返回 `COUPON_EXPIRED`、`INVALID_STATUS`、`NOT_FOUND`。

#### `GET /me/points`

```json
{
  "balance": 1250,
  "totalEarned": 1500,
  "totalSpent": 250,
  "consecutiveSigninDays": 3,
  "lastSigninDate": "2026-09-20"
}
```

没有积分账户时由服务端创建余额为 0 的账户，不能返回空数据或 `null`。

#### `POST /me/signin`

成功和重复签到都返回业务结果：

```json
{
  "signedIn": true,
  "alreadySignedIn": false,
  "pointsEarned": 10,
  "consecutiveDays": 3,
  "balance": 1260,
  "achievementUnlocked": null
}
```

同日重复签到返回 `alreadySignedIn=true`、原来的 `pointsEarned` 和当前余额，不重复写流水。

#### `GET /points/items`

只返回同时满足以下条件的商品：

- `itemType=coupon`。
- 商品状态为 `on`。
- 当前时间在 `startAt` 和 `endAt` 之间。
- `remainStock > 0`。
- 关联券模板状态为 `on`。
- 关联券模板库存大于 0。

返回字段：`id`、`name`、`description`、`imageUrl`、`pointsCost`、`remainStock`、`limitPerUser`、`validDays`、`status`。

#### `POST /points/exchange`

请求体：

```json
{
  "itemId": 3
}
```

请求头必须包含 `Idempotency-Key`。成功返回：

```json
{
  "exchangeNo": "EX202609200001",
  "status": "completed",
  "pointsCost": 300,
  "balance": 950,
  "userCouponId": 1002,
  "couponName": "平台旅行券"
}
```

兑换、扣积分、扣商品库存、扣券模板库存、创建兑换单和创建用户券必须在同一事务中完成；任一步失败全部回滚。

### 10.4 管理端接口数据结构

#### 优惠券模板

创建和修改请求字段固定为：

```json
{
  "code": "TRAVEL100",
  "name": "平台旅行券",
  "type": "deduction",
  "discountAmount": 10.00,
  "minOrderAmount": 0,
  "discountRate": null,
  "validDays": 30,
  "totalCount": 1000,
  "perUserLimit": 1,
  "usageGuide": "仅限平台指定订单使用"
}
```

`partnerId` 不出现在阶段六请求体中，由服务端固定写入 `NULL`。

已经发出用户券的模板禁止修改 `discountAmount`、`minOrderAmount`、`discountRate`、`validDays` 和 `perUserLimit`；需要修改时必须新建模板。

#### 管理端发券

请求体：

```json
{
  "userIds": [10021, 10044],
  "reason": "运营补发"
}
```

规则：

- `userIds` 必填，数量范围为 1 到 100。
- `reason` 必填，长度 2 到 200 个字符。
- 每个用户单独返回成功或失败原因。
- 成功响应包含 `successCount`、`failedCount`、`items`。
- 每次操作写入 `admin_audit_log`，保存券 ID、用户 ID、原因和结果摘要。

#### 积分规则

MVP 只允许以下配置：

```json
{
  "signinPoints": 10,
  "achievementPoints": {
    "bronze": 50,
    "silver": 100,
    "gold": 200
  }
}
```

禁止提交订单、点赞、打卡或任意未冻结字段。规则修改必须记录旧值、新值和管理员 ID。

## 11. 数据库字段、索引和约束

### 11.1 `coupon_redemption`

```text
id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
redemption_no      VARCHAR(40) NOT NULL UNIQUE
user_coupon_id     BIGINT UNSIGNED NOT NULL UNIQUE
coupon_id          BIGINT UNSIGNED NOT NULL
user_id            BIGINT UNSIGNED NOT NULL
order_id           BIGINT UNSIGNED NULL
verify_code        VARCHAR(32) NOT NULL
status             VARCHAR(16) NOT NULL DEFAULT 'redeemed'
verified_by        BIGINT UNSIGNED NOT NULL
verified_at        DATETIME(3) NOT NULL
remark             VARCHAR(255) NULL
created_at         DATETIME(3) NOT NULL
updated_at         DATETIME(3) NOT NULL
```

索引：`idx_user_time(user_id, created_at)`、`idx_coupon(coupon_id, created_at)`、`idx_verify(verify_code)`。

### 11.2 `user_prize`

```text
id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
grant_no           VARCHAR(40) NOT NULL UNIQUE
grant_key          VARCHAR(100) NOT NULL UNIQUE
user_id            BIGINT UNSIGNED NOT NULL
order_id           BIGINT UNSIGNED NOT NULL
blind_box_prize_id BIGINT UNSIGNED NOT NULL
prize_type         VARCHAR(16) NOT NULL
coupon_id          BIGINT UNSIGNED NULL
user_coupon_id     BIGINT UNSIGNED NULL
status             VARCHAR(16) NOT NULL
failure_reason     VARCHAR(255) NULL
grant_at           DATETIME(3) NULL
created_at         DATETIME(3) NOT NULL
updated_at         DATETIME(3) NOT NULL
```

索引：`idx_user(user_id, created_at)`、`idx_order(order_id)`、`idx_status(status, created_at)`。

### 11.3 `user_signin`

```text
user_id            BIGINT UNSIGNED NOT NULL
signin_date        DATE NOT NULL
points_earned      INT UNSIGNED NOT NULL
consecutive_days   INT UNSIGNED NOT NULL
created_at         DATETIME(3) NOT NULL
PRIMARY KEY(user_id, signin_date)
```

### 11.4 `point_item`

```text
id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
item_type          VARCHAR(16) NOT NULL DEFAULT 'coupon'
name               VARCHAR(100) NOT NULL
description        VARCHAR(500) NULL
image_url          VARCHAR(500) NULL
points_cost        INT UNSIGNED NOT NULL
coupon_id          BIGINT UNSIGNED NOT NULL
stock              INT UNSIGNED NOT NULL
remain_stock       INT UNSIGNED NOT NULL
limit_per_user     INT UNSIGNED NOT NULL DEFAULT 1
status             VARCHAR(8) NOT NULL DEFAULT 'on'
sort_weight        INT NOT NULL DEFAULT 0
start_at           DATETIME(3) NULL
end_at             DATETIME(3) NULL
created_at         DATETIME(3) NOT NULL
updated_at         DATETIME(3) NOT NULL
```

索引：`idx_status_sort(status, sort_weight)`、`idx_time(status, start_at, end_at)`。

### 11.5 `point_exchange_order`

```text
id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
exchange_no        VARCHAR(40) NOT NULL UNIQUE
request_id         VARCHAR(80) NOT NULL UNIQUE
user_id            BIGINT UNSIGNED NOT NULL
item_id            BIGINT UNSIGNED NOT NULL
item_type          VARCHAR(16) NOT NULL
points_cost        INT UNSIGNED NOT NULL
status             VARCHAR(16) NOT NULL
user_coupon_id     BIGINT UNSIGNED NULL
failure_reason     VARCHAR(255) NULL
created_at         DATETIME(3) NOT NULL
updated_at         DATETIME(3) NOT NULL
```

索引：`idx_user_time(user_id, created_at)`、`idx_item_status(item_id, status)`。

### 11.6 既有表唯一键

- `user_coupon.coupon_no` 唯一。
- `user_coupon.verify_code` 唯一。
- `user_coupon.grant_request_id` 唯一。
- `point_log.request_id` 唯一。
- `user_point.user_id` 继续作为主键，不改主键策略。
- `coupon.partner_id` 继续允许 `NULL`，不删除旧字段。

## 12. 后端文件任务

在现有 `server/src/main/java/com/tuge` 结构中新增或修改：

### Entity / Mapper

- `domain/entity/CouponRedemption.java`
- `domain/entity/UserPrize.java`
- `domain/entity/UserSignin.java`
- `domain/entity/PointItem.java`
- `domain/entity/PointExchangeOrder.java`
- `domain/entity/UserCoupon.java`
- `domain/entity/UserPoint.java`
- `domain/entity/PointLog.java`
- 对应 `domain/mapper/*Mapper.java`

所有 Mapper 继承现有 MyBatis-Plus `BaseMapper`；并发扣减使用带条件的 XML 或注解 SQL，不使用先查后改。

### DTO / VO

- `CouponUpsertRequest`
- `CouponGrantRequest`
- `CouponUseVO`
- `UserCouponVO`
- `PointOverviewVO`
- `PointHistoryVO`
- `SigninResultVO`
- `PointItemUpsertRequest`
- `PointExchangeRequest`
- `PointExchangeVO`
- `UserPrizeVO`

DTO 只接收客户端允许字段，不能直接使用 Entity 作为请求体。

### Service

- `CouponService`：券模板、卡包查询和过期口径。
- `CouponGrantService`：所有来源发券和库存幂等。
- `CouponRedemptionService`：用户使用券和核销记录。
- `PointService`：账户、流水、签到积分和成就积分。
- `SigninService`：北京时间日期和连续签到。
- `PointExchangeService`：兑换事务。
- `PrizeGrantService`：开盒奖品实例和失败状态。
- `RewardEventService`：成就奖励事件幂等。
- `PointStatisticsService`：统计和排行只读聚合。

所有跨表写入方法使用 `@Transactional`，所有当前用户身份从 `JwtContext` 获取。

### Controller

- `controller/CouponController.java`
- `controller/PointController.java`
- `controller/PrizeController.java`
- `controller/admin/CouponAdminController.java`
- `controller/admin/PointAdminController.java`

不新增 `PartnerController`、`PartnerAdminController` 或商家 Service。

## 13. 小程序文件任务

### 13.1 API 和状态

修改 `miniapp/services/api.js`，新增：

```javascript
listMyCoupons(params)
getMyCoupon(id)
useMyCoupon(id)
getMyPoints()
listPointHistory(params)
signin()
listPointItems(params)
exchangePointItem(itemId, idempotencyKey)
getPrize(id)
```

新增：

```text
miniapp/utils/wallet-store.js
miniapp/utils/points-store.js
```

Store 只缓存最近一次服务端结果，不保存券状态、积分余额或奖品发放结果作为权威数据。

### 13.2 页面和组件

新增或修改：

```text
miniapp/pages/coupon/index/
miniapp/pages/coupon/detail/
miniapp/pages/points/index/
miniapp/pages/points/history/
miniapp/pages/points/mall/
miniapp/pages/prize/coupon/
miniapp/components/CouponCard/
miniapp/components/CouponTabs/
miniapp/components/DailySignin/
miniapp/components/PointsBadge/
```

每个页面必须实现：加载态、空态、网络错误、登录失效、重复提交、成功态和服务端业务错误态。

按钮行为：

- 用券按钮点击后立即禁用，成功或失败后恢复。
- 兑换按钮提交期间禁用，成功后刷新积分、流水和卡包。
- 签到按钮重复点击只允许一个请求在途。
- 卡包状态以服务端返回为准，不在前端自行改成已使用。

不新增小程序 Tab，入口放入“我的”、开盒结果和成就结果页。

## 14. 管理端文件任务

### 14.1 API 类型

新增：

```text
admin-web/src/api/coupon.ts
admin-web/src/api/points.ts
admin-web/src/stores/rewards.ts
```

所有 API 类型必须与 OpenAPI 字段一致，不再使用 snake_case 兼容字段。

### 14.2 页面

新增：

```text
admin-web/src/views/coupons/index.vue
admin-web/src/views/points/index.vue
```

优惠券页包括：

- 名称、类型、状态筛选。
- 创建和编辑抽屉。
- 上下架确认。
- 库存、已发放、已使用、剩余量展示。
- 指定用户发券弹窗。
- 发放记录和失败原因。

积分页包括三个区块：

- 积分商品 CRUD。
- 签到和成就积分规则。
- 总发放、总消耗、兑换量、签到量和用户排行。

修改以下导航和路由文件：

```text
admin-web/src/constants/nav.ts
admin-web/src/router/index.ts
```

不新增商家路由、商家导航和商家页面。

## 15. Seed 演示数据

`seed.sql` 必须提供以下固定数据，并保证按约定顺序可重复执行：

| 场景 | 数据要求 |
|---|---|
| 可用平台券 | 2 个 `partner_id=null`、状态 `on` 的券 |
| 已下架平台券 | 1 个状态 `off` 的券 |
| 用户未使用券 | 用户 10021 至少 1 张，未过期 |
| 用户已使用券 | 用户 10021 至少 1 张，并有 redemption 记录 |
| 用户已过期券 | `valid_until` 早于当前演示日期 |
| 积分账户 | 至少 3 个用户，余额不同 |
| 签到记录 | 连续签到 3 天和断签 1 天各一组 |
| 积分商品 | 可兑换、售罄、未开始各 1 个 |
| 兑换单 | completed 和 failed 各 1 条 |
| 用户奖品 | granted 和 failed 各 1 条 |
| 成就奖励 | points 和 coupon 各 1 条 |

seed 重跑必须先删除阶段六新增业务数据，再按 `user_coupon -> point_exchange_order -> point_item -> user_prize -> coupon_redemption -> user_signin -> point_log -> user_point` 的依赖顺序重新插入。

## 16. 逐日完成门槛

每天下班前必须满足对应出口条件，否则第二天不得扩大开发范围：

| 天数 | 出口条件 |
|---:|---|
| 1 | 状态、字段、错误码、权限和排除项签字确认 |
| 2 | OpenAPI 可被解析；请求体和响应体无 snake_case/camelCase 冲突 |
| 3 | 空库执行 schema 成功；seed 可执行两次 |
| 4 | 发券、积分账户和流水单元测试通过 |
| 5 | 卡包列表和积分概览可以读取真实数据库数据 |
| 6 | 并发发券不会超库存，管理端可完成模板创建和发券 |
| 7 | 重复签到只产生一条记录，连续天数计算正确 |
| 8 | 兑换成功同时生成兑换单、积分流水和用户券 |
| 9 | 重复开盒只生成一个用户奖品实例 |
| 10 | 成就奖励重复消费不重复发放 |
| 11 | 管理统计可由明细表重新计算得到相同结果 |
| 12 | 用券重复提交、越权访问和错误状态均有固定响应 |
| 13 | 自动化测试、并发测试、reset/seed 测试通过 |
| 14 | 三端截图、录屏、验收表和阶段七交接材料归档 |

## 17. 测试用例清单

### 17.1 券和库存

- `C-001`：创建平台券，`partner_id` 必须为 `NULL`。
- `C-002`：发券数量等于库存，全部成功。
- `C-003`：库存不足时部分失败，成功数和失败原因准确。
- `C-004`：两个并发请求同时发最后一张券，只允许一个成功。
- `C-005`：已发券模板修改面值，返回 `409`。
- `C-006`：用户访问他人的 `user_coupon`，返回 `403`。
- `C-007`：过期券列表归入 `expired`，不能使用。
- `C-008`：同一券并发使用，只生成一条 redemption。

### 17.2 积分和签到

- `P-001`：首次签到增加配置积分并写入流水。
- `P-002`：同日重复签到返回已签到，不增加余额。
- `P-003`：连续三天签到返回 3，断签后重新从 1 开始。
- `P-004`：并发兑换不会产生负余额。
- `P-005`：积分不足返回 `POINTS_INSUFFICIENT`，余额和流水不变。
- `P-006`：积分流水按用户、类型和时间分页正确。

### 17.3 兑换和奖励

- `R-001`：兑换成功同时写入兑换单、负积分流水和用户券。
- `R-002`：相同 `Idempotency-Key` 重试返回原兑换单。
- `R-003`：商品售罄返回 `POINT_ITEM_SOLD_OUT`。
- `R-004`：券模板库存不足时兑换整笔回滚。
- `R-005`：开盒重复调用不重复生成 `user_prize`。
- `R-006`：成就事件重复消费不重复发积分或券。
- `R-007`：奖品发放失败记录失败原因，不能伪造为成功。

### 17.4 权限和数据重置

- `A-001`：`cs` 访问统计成功，创建券返回 `403`。
- `A-002`：`operator` 创建、编辑、上下架平台券成功。
- `A-003`：所有敏感写操作写入 `admin_audit_log`。
- `A-004`：schema 空库执行成功。
- `A-005`：schema 重复执行成功。
- `A-006`：seed 重复执行成功且关键数量不膨胀。

## 18. 阶段完成定义

只有以下条件全部满足，才允许标记阶段六完成：

- 新增执行方案、OpenAPI、schema、seed 和增量 SQL 已同步。
- 没有任何阶段六接口依赖商家 API 或商家数据。
- 所有新增平台券的 `partner_id` 均为 `NULL`。
- 用户卡包、签到、积分商城、兑换和奖品页面真实联调通过。
- 管理端优惠券和积分页面真实联调通过。
- 所有 `C-*`、`P-*`、`R-*`、`A-*` 测试用例通过。
- 并发测试没有负余额、超库存、重复核销或重复奖励。
- `mvn test -q`、管理端构建、小程序 JS 检查和 OpenAPI 解析通过。
- 页面加载、空、错误、未登录、重复提交、成功和失败状态均有截图证据。
- 阶段七交接材料明确列出商家、结算、实物履约、冲正和积分高级能力仍未实现。
