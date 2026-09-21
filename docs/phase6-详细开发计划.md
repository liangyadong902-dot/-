# 阶段六：商家合作与积分详细开发计划

> 版本：v1.0  
> 阶段：Phase 6  
> Timebox：2 周（14 个工作日，含 1 天缓冲）  
> 用户端形态：原生微信小程序  
> 依据：`docs/开发计划.md` §8、`docs/phase5-详细开发计划.md`、`docs/phase4-详细开发计划.md`、`docs/功能模块设计.md`、`docs/接口设计.md`、`docs/数据库设计.md`、`docs/schema.sql`、`docs/seed.sql`、`docs/openapi.yaml`

> **原型还原硬性要求：** 卡包、优惠券详情、积分中心、积分商城、签到、兑换结果、奖品详情以及管理端商家/优惠券/积分页面，必须沿用现有原型、视觉 Token、字体、颜色、间距、圆角、阴影、图标和交互语言。加载、空数据、错误、未登录、已使用、已过期、库存不足、重复提交和成功状态均属于验收范围。功能可用但存在未关闭的产品级视觉或交互差异，不得标记为阶段完成。

---

## 1. 阶段目标与当前基础

### 1.1 阶段定位

阶段六名称为“商家合作与积分”，目标是形成平台的差异化权益闭环：

```text
商家/合作方
      │
      ├── 优惠券模板 ──> 用户卡包 ──> 核销/使用
      │
      └── 盲盒奖品配置 ──> 用户奖品实例 ──> 用户卡包

签到 / 打卡 / 成就 / 已冻结的业务事件
      │
      └──> 积分账户 ──> 积分流水 ──> 积分商城 ──> 兑换优惠券
```

阶段六必须把资产、积分、优惠券和奖励做成可审计、可重放、可恢复的服务端闭环，而不是只增加前端页面或演示数据。

### 1.2 当前已有基础

数据库已经预留以下模型：

- `partner`：商家/合作方；本阶段沿用 `partner` 命名，不平行新建 `merchant` 表。
- `coupon`：优惠券模板。
- `user_coupon`：用户持有优惠券。
- `user_point`：用户积分账户。
- `point_log`：积分流水。
- `blind_box_prize`：盲盒奖品配置，不等同于用户中奖实例。
- `checkin`、`achievement`、`user_achievement`：阶段五交付的行为与成就基础。
- `admin_audit_log`：管理员操作审计基础。

当前缺口：

- 没有 `coupon_redemption` 核销记录模型。
- 没有用户奖品发放实例模型。
- 没有积分商品和积分兑换订单模型。
- 没有每日签到唯一记录模型。
- `user_point` / `point_log` 尚未形成统一的并发、幂等和冲正机制。
- `schema.sql` 的 DROP 区域未完整覆盖新增业务表。
- `seed.sql` 缺少足以覆盖卡包、奖品、兑换和积分闭环的演示数据。
- `docs/openapi.yaml` 尚未完整定义阶段六接口和 schema。

### 1.3 阶段三、四、五依赖

阶段六不得重写已有交易和社交能力，必须消费以下稳定输出：

- 阶段三：用户身份、订单、支付、退款、开盒、行程、徽章。
- 阶段四：用户资产统计、资料、AI 和统一用户隔离。
- 阶段五：社区、打卡、成就、`achievement.reward_type`、`achievement.reward_value`、`user_achievement.reward_sent`、成就解锁幂等语义和审计字段。

如果阶段五尚未明确成就奖励事件、`checkin.trip_id`、内容状态或成就统计口径，阶段六第 1 天必须先完成交接复核，不能假定这些语义已经稳定。

---

## 2. 范围与边界

### 2.1 本阶段必须交付

| 业务域 | 本阶段交付 |
|---|---|
| 商家/合作方 | 管理端列表、创建、编辑、审核、启停、详情和基础统计 |
| 优惠券 | 模板 CRUD、上下架、库存、发放、用户卡包、状态筛选、详情、使用/核销记录 |
| 积分账户 | 余额、累计获得、累计消耗、流水、签到、连续签到 |
| 积分商城 | 优惠券类型商品列表、库存、兑换、扣分、发券、兑换状态 |
| 盲盒奖品 | 配置到用户奖品实例，优惠券奖品进入 `user_coupon`，开盒重试不重复发放 |
| 成就联动 | 阶段五成就解锁通过统一积分/奖励服务产生积分或奖励，重复事件不重复发放 |
| 管理统计 | 商家、优惠券领取/使用、积分发放/消耗、用户排行、兑换状态 |
| 审计与安全 | 管理操作审计、余额和库存并发保护、券码防重放、跨商家核销防护 |

### 2.2 本阶段核心验收范围

必须覆盖总计划的九项验收：

1. 我的卡包展示全部优惠券，并且可以按状态筛选。
2. 每日签到获得积分，连续签到天数正确累计。
3. 积分商城展示可兑换商品。
4. 积分兑换成功后，优惠券自动进入卡包。
5. 开盒获得的优惠券在卡包中正确展示。
6. 管理端商家入驻审核流程完整。
7. 管理端可以创建优惠券并发放给用户。
8. 管理端可以查看积分统计报表。
9. 成就系统与积分联动正常。

### 2.3 明确不做或仅预留

两周 MVP 不默认承诺以下能力：

- 独立商家门户、商家账号和商家角色。
- 完整商家资质认证、合同管理和账户管理。
- 复杂多级佣金、税务、财务结算、付款和结算导出。
- 完整实物商品履约、收货地址、物流、售后和退款。
- 物理盲盒奖品发货、替换和失败处理。
- 积分转赠、积分过期、复杂限额和高级风控。
- 完整核销冲正、争议处理和复杂退款回收。
- 新增第六个小程序 Tab；优先从“我的”、首页运营位和开盒结果进入。
- 重写订单、支付、退款、开盒、社区、打卡或成就基础流程。
- AI 直接修改订单、支付、退款、奖励或积分。

`merchandise`、`merchandise_order_no`、佣金和结算字段可以保留为数据预留，但除非在第 1–2 天明确批准，否则不作为本阶段验收能力。建议本阶段积分商城只实际履约 `coupon` 类型商品。

---

## 3. 阶段入口门禁

编码前完成以下门禁，并将结果记录为 `v6-contract-freeze`。

### Gate 1：业务边界

必须书面确认：

- 商家统一使用 `partner`，不新增 `merchant` 表。
- 商家操作由平台管理端代办，是否开放独立商家端延后。
- 本阶段不生成可付款结算单。
- 积分商城第一期只履约优惠券兑换；实物商品只做预留或明确排除。
- 成就、签到、打卡、订单/开盒哪些事件产生积分，以及发放时点。
- 退款、取消、无效行程是否回收已经发放的积分或优惠券。

### Gate 2：数据模型

冻结以下关系和表：

- `partner`、`coupon`、`user_coupon`。
- `coupon_redemption`。
- `user_prize` 或 `prize_grant`。
- `user_point`、`point_log`。
- `user_signin`。
- `point_item`、`point_exchange_order`。
- 阶段五 `achievement` / `user_achievement` 奖励事件。

### Gate 3：状态机

为商家、券模板、用户券、核销、奖品发放、积分流水和兑换单分别冻结：

- 状态枚举。
- 允许的前置状态。
- 操作者和角色。
- 是否可逆。
- 重复请求的返回结果。
- 对库存、积分、订单、用户资产和审计的影响。

### Gate 4：幂等和并发

冻结：

- 业务幂等键格式和唯一范围。
- 重复请求的 HTTP 状态与返回数据。
- 库存扣减、积分余额更新、券发放、奖品发放和核销的原子方式。
- 失败后的重试与补偿策略。
- “记录已成功”与“实际发放失败”之间的恢复方式。

### Gate 5：权限和隐私

冻结：

- 用户、管理员和未来商家角色边界。
- `super_admin`、`operator`、`finance`、`cs`、`analyst` 的权限。
- 商家联系人、电话、佣金、核销人和用户券码的脱敏规则。
- 管理审计字段。
- 券码枚举、二维码重放和跨商家核销防护。

### Gate 6：数据库重置和演示

必须验证：

- 新增表按外键依赖逆序 DROP。
- `schema.sql` 空库执行成功。
- schema/reset 可重复执行。
- `seed.sql` 可初始化并按约定重跑。
- seed 包含商家、券模板、用户券、用户奖品、积分账户、积分流水、签到、积分商品和兑换演示数据。
- 失败事务、重试和回滚行为有记录。

未通过入口门禁不得开始三端并行开发；若门禁延期，必须缩减交付范围，不得隐式扩展状态机和结算能力。

---

## 4. 契约冻结

### 4.1 通用约定

继续使用：

- `docs/openapi.yaml` 作为唯一 API 契约来源。
- 用户端 `/api/v1/...`、管理端 `/api/v1/admin/...` 命名空间。
- `{ code, message, data }` 响应封装。
- API 字段 camelCase，数据库字段 snake_case。
- 数据库金额为整数分，接口金额为元。
- API 时间使用现有北京时间字符串格式。
- `400` 参数错误、`401` 未认证、`403` 无权限/跨用户、`404` 不存在、`409` 状态冲突、`422` 余额/库存/规则不足。
- 所有当前用户 ID 从 `JwtContext` 获取。

### 4.2 路径冲突必须解决

阶段六文档存在以下不一致，必须在 `v6-contract-freeze` 中统一：

1. 优惠券详情：`GET /api/v1/coupons/{id}` 与 `GET /api/v1/me/coupons/{id}`。
   - 推荐用户持有券详情使用 `GET /api/v1/me/coupons/{id}`。
   - 若需要查看公开券模板，再另定义 `GET /api/v1/coupons/{id}`，返回模板而不是用户资产。
2. `partner` 与 `merchant`。
   - 推荐 API、数据库、Java 和前端统一使用 `partner`，页面中文显示“商家”。
3. `points/items`、`points/exchange` 与 `rewards/redeem`。
   - 推荐沿用既有计划的 `/points/items`、`/points/exchange`，不要同时保留三套语义。
4. `coupon`、`user_coupon`、`redemption`。
   - 明确券模板、用户资产和核销事实是三个不同资源。
5. 旧文档中的 `/auth/sms`、`/auth/sms/send`、`/admin/payments`、`/admin/pay-flows` 等旧冲突不得复制到阶段六；以 `docs/openapi.yaml` 为准。

### 4.3 用户端接口

#### 用户卡包和优惠券

```text
GET  /api/v1/me/coupons
GET  /api/v1/me/coupons/{id}
POST /api/v1/me/coupons/{id}/use
```

要求：

- 支持 `status=unused|used|expired`、分页。
- 详情返回商家、优惠内容、门槛、开始/结束时间、用户券码、使用说明和状态。
- `use` 必须校验当前用户、券模板、商家、有效期、订单关系和券当前状态。
- `use` 成功返回核销记录/核销码；不能只更新 `user_coupon.status` 而没有核销事实。

#### 积分与签到

```text
GET  /api/v1/me/points
GET  /api/v1/me/points/history
POST /api/v1/me/signin
```

积分概览至少返回：

- `balance`；
- `totalEarned`；
- `totalSpent`；
- 当前连续签到天数或最近签到信息。

流水支持类型筛选和分页。签到返回本次积分、连续天数和可能解锁的成就。

#### 积分商城和兑换

```text
GET  /api/v1/points/items
POST /api/v1/points/exchange
```

第一期商品类型推荐仅开放 `coupon`。兑换请求必须返回兑换单号、状态、扣除积分和发放券结果；发放失败必须可重试或补偿。

#### 奖品

```text
GET /api/v1/prizes/{id}
```

该接口返回用户奖品实例，而不是直接暴露 `blind_box_prize` 配置。若原计划使用订单或开盒结果中的奖品嵌套数据，必须在 OpenAPI 中统一两种返回来源。

### 4.4 管理端接口

```text
GET/POST       /api/v1/admin/partners
GET/PUT        /api/v1/admin/partners/{id}
PATCH          /api/v1/admin/partners/{id}/status
GET            /api/v1/admin/partners/{id}/statistics

GET/POST       /api/v1/admin/coupons
GET/PUT        /api/v1/admin/coupons/{id}
PATCH          /api/v1/admin/coupons/{id}/status
GET            /api/v1/admin/coupons/{id}/records
POST           /api/v1/admin/coupons/{id}/grant

GET/POST       /api/v1/admin/points/items
PUT            /api/v1/admin/points/items/{id}
DELETE         /api/v1/admin/points/items/{id}
GET/PUT        /api/v1/admin/points/rules
GET            /api/v1/admin/points/statistics
GET            /api/v1/admin/points/ranking
```

具体请求体、分页参数和返回 schema 必须写入 OpenAPI，不以本计划中的接口列表代替契约。

管理端商家字段包括：

- `name`、`type`、`contact`、`phone`、`address`、`description`、`logoUrl`。
- `commissionRate`、`settlementType` 仅作配置/快照字段；本阶段不生成付款结算单。
- `status`、`rejectReason`、营业时间和有效期按现有表能力决定。

管理端优惠券字段包括：

- `code`、`name`、`type`、`partnerId`。
- `discountAmount`、`minOrderAmount`、`discountRate`、`validDays`。
- `totalCount`、`remainCount`、状态、有效期和每用户限领。

### 4.5 权限矩阵

| 动作 | 允许角色 |
|---|---|
| 商家、优惠券、积分统计只读 | `super_admin`、`operator`、`finance`、`cs`、`analyst` |
| 商家创建/编辑/审核/启停 | `super_admin`、`operator` |
| 优惠券模板创建/编辑/上下架 | `super_admin`、`operator` |
| 批量发券、奖励补发 | `super_admin`、`operator`、`cs`；涉及财务金额时增加 `finance` |
| 积分规则和商品写入 | `super_admin`、`operator` |
| 人工增减积分 | `super_admin`、`finance`，必须填写原因 |
| 核销纠错/冲正 | `super_admin`、`finance` |
| 统计导出 | `super_admin`、`finance`、`analyst` |

服务端 Service 必须二次校验，前端隐藏按钮不能作为安全控制。

---

## 5. 数据模型与状态机

以下模型和字段在第 1–2 天根据现有 DDL 实际确认；新增字段必须同步 schema、seed、OpenAPI、Entity 和回滚说明。

### 5.1 `partner` 商家/合作方

继续使用现有表，重点确认：

- `totalOrders`、`totalAmountCent` 是缓存统计还是展示聚合，不能作为唯一财务事实。
- 历史优惠券和核销记录必须保存合作方 ID，必要时保存商家名称和佣金比例快照。
- 商家停用后，已发用户券是否仍可使用必须冻结；推荐停止新发放，但已发且未过期的券按券规则处理。

推荐一期状态：

```text
pending → on
pending → off
on      → off
off     → on
```

如改用 `draft/pending_review/approved/rejected/suspended/terminated`，必须写出与现有 `pending/on/off` 的映射，不得两套状态并存。

### 5.2 `coupon` 券模板

现有字段：

```text
id, code, name, type, partner_id,
discount_amount, min_order_amount, discount_rate,
valid_days, total_count, remain_count, status,
created_at, updated_at
```

若实现有效期、限领和并发库存，建议补充：

```text
start_at
end_at
per_user_limit
version
```

规则：

- `code` 是券模板标识，不是用户专属券码。
- 发放扣减 `remain_count` 必须用条件更新、版本号或行锁。
- 已有发放记录后不允许任意修改影响用户权益的金额、门槛和有效期；推荐编辑转为新版本或限制字段。
- `off` 的含义必须明确是停止领取、停止核销还是两者都停止。
- 过期可通过查询动态判断，但列表和统计必须使用统一口径。

### 5.3 `user_coupon` 用户券

现有字段：

```text
id, user_id, coupon_id, source, source_id,
order_id, status, obtained_at, valid_until,
used_at, created_at, updated_at
```

建议补充或等价表达：

```text
coupon_no
verify_code
source_type
issued_by
expired_at
```

推荐状态：

```text
granted → available → locked → redeemed
                   ↘ expired
                   ↘ revoked
locked → available
redeemed → reversed
```

若 API 仅向用户展示 `unused/used/expired`，内部仍必须有核销锁定或条件更新方案，避免并发双核销。

发券幂等键至少应包含：

```text
(user_id, coupon_id, source_type, source_id)
```

具体是否允许同一来源发多张券，必须由券模板的限领规则决定。

### 5.4 `coupon_redemption` 核销记录

当前不存在，阶段六应新增。至少包含：

```text
id
redemption_no
user_coupon_id
coupon_id
user_id
partner_id
order_id
verify_code
status
verified_by
verified_at
amount_before_cent
discount_amount_cent
remark
created_at
updated_at
```

推荐状态：

```text
requested → locked → redeemed
                   ↘ rejected
locked → released
redeemed → reversed
```

必须保证：

- 同一用户券只能成功核销一次。
- 核销人属于允许操作该商家的角色或平台角色。
- 券、用户、商家和订单关系一致。
- 核销码不可预测、不可枚举、不可跨商家使用。
- 是否支持冲正需在本阶段门禁中明确；默认列为后续能力。

### 5.5 用户奖品实例

`blind_box_prize` 是配置表，不能直接充当用户资产。建议新增 `user_prize`（或批准等价名称），至少表达：

```text
id
grant_no
user_id
order_id
blind_box_prize_id
prize_type
coupon_id
partner_id
status
granted_at
used_at
failure_reason
created_at
updated_at
```

开盒事件与用户奖品实例必须具备唯一幂等关系，例如：

```text
(order_id, blind_box_prize_id, prize_type)
```

若一个订单可能抽取多个奖品，应使用开盒事件 ID + 序号，而不是简单依赖配置表 ID。

### 5.6 `user_point` 积分账户

当前账户应明确主键策略：

- 保留 `user_id` 为主键；或
- 使用自增 `id` 为主键并为 `user_id` 建唯一键。

建议增加 `version`。余额只能由 `PointService` 修改，客户端不能提交余额、累计值或最终结果。

余额更新与流水写入必须同一事务：

1. 取得幂等键。
2. 锁定账户或执行带条件更新。
3. 检查余额不得低于 0。
4. 更新 `balance`、`totalEarned`、`totalSpent`。
5. 写入 `point_log`。
6. 返回事务后的余额。

### 5.7 `point_log` 积分流水

现有字段：

```text
id, user_id, change, balance_after, type,
biz_id, description, created_at
```

建议增加或等价表达：

```text
request_id
operator_type
rule_code
source_type
source_id
```

必须冻结唯一幂等维度，例如：

```text
(user_id, type, biz_id, action)
```

推荐追加冲正流水，不修改已入账事实；如使用状态字段，应明确 `pending → posted → reversed` 的规则。

### 5.8 `user_signin` 签到记录

仅依赖 `point_log(type='signin')` 无法可靠限制每日一次。建议新增：

```text
user_signin
-----------
user_id
signin_date
points_earned
consecutive_days
created_at
```

主键：

```text
PRIMARY KEY (user_id, signin_date)
```

规则：

- 日期统一按北京时间计算。
- 同一天重复签到返回已经签到结果，不重复发积分。
- 连续天数由前一天记录计算，断签后从 1 重新开始。
- 补签、跨时区、节假日加成不在本阶段默认实现。

### 5.9 `point_item` 积分商品

若实际实现积分商城优惠券兑换，新增：

```text
id
item_type
name
description
image_url
points_cost
coupon_id
stock
remain_stock
limit_per_user
status
sort_weight
start_at
end_at
created_at
updated_at
```

第一期只允许 `item_type='coupon'`，`merchandise` 仅作为预留或明确不展示。积分商品库存必须与券模板库存协调，不能兑换成功后才发现无券可发。

### 5.10 `point_exchange_order` 兑换单

不能只写一条积分流水代替兑换事实。建议新增：

```text
id
exchange_no
user_id
item_id
item_type
points_cost
status
user_coupon_id
failure_reason
created_at
updated_at
```

推荐状态：

```text
created → reserved → points_deducted → fulfilled → completed
                              ↘ failed
                              ↘ cancelled
```

如果发券失败，必须保留兑换单和扣分状态，支持补偿、重试或原子回滚；不能返回前端“成功”但没有卡包资产。

### 5.11 商家结算

`partner` 的佣金字段只作为合作配置和历史快照来源。本阶段不生成可付款结算单；若业务临时要求纳入，必须另增佣金明细、结算批次、审批和付款状态，并重新评估两周范围，不得隐式实现。

---

## 6. 后端详细开发计划

### 6.1 推荐模块

```text
server/src/main/java/com/tuge/
├── controller/
│   ├── PartnerController.java
│   ├── CouponController.java
│   ├── PointController.java
│   └── PrizeController.java
├── controller/admin/
│   ├── PartnerAdminController.java
│   ├── CouponAdminController.java
│   ├── PointAdminController.java
│   ├── PrizeAdminController.java
│   └── RedemptionAdminController.java
├── domain/entity/
│   ├── Partner.java
│   ├── Coupon.java
│   ├── UserCoupon.java
│   ├── CouponRedemption.java
│   ├── UserPoint.java
│   ├── PointLog.java
│   ├── UserSignin.java
│   ├── PointItem.java
│   ├── PointExchangeOrder.java
│   ├── BlindBoxPrize.java
│   └── UserPrize.java
└── domain/service/
    ├── PartnerService.java
    ├── CouponService.java
    ├── CouponRedemptionService.java
    ├── PointService.java
    ├── PointExchangeService.java
    ├── PrizeGrantService.java
    ├── SigninService.java
    └── PartnerStatisticsService.java
```

实际类名遵循仓库现有命名和 MyBatis-Plus 结构，不因为计划中的建议路径提前假定代码已经存在。

### 6.2 统一发券服务

`CouponService` 负责所有发券来源：

- 阶段五成就奖励。
- 阶段三开盒奖品。
- 积分商城兑换。
- 管理端指定用户或批量发放。
- 后续优惠活动扩展。

统一流程：

1. 校验券模板和商家状态。
2. 校验用户限领、总库存和来源幂等键。
3. 条件扣减 `remain_count`。
4. 生成用户券号和不可预测核销码。
5. 插入 `user_coupon`。
6. 写入来源、操作者和审计信息。
7. 失败时恢复库存或进入可补偿状态。

不得在多个 Controller 中复制发券逻辑。

### 6.3 统一积分服务

所有积分变化必须经过 `PointService`：

- 每日签到。
- 阶段五打卡奖励。
- 阶段五成就解锁奖励。
- 订单/开盒奖励（仅在契约冻结后纳入）。
- 积分兑换扣减。
- 管理员人工调整。
- 退款或冲正。

每次变化在一个事务中完成：

1. 校验来源和幂等键。
2. 锁定账户或条件更新。
3. 检查余额和规则。
4. 更新账户。
5. 写流水和来源。
6. 人工操作写审计。

### 6.4 阶段五成就联动

阶段六不重新实现成就计算，只消费阶段五提供的解锁事件或调用其稳定服务：

1. 成就首次达到阈值。
2. 阶段五生成稳定的成就解锁事件 ID。
3. 阶段六根据 `reward_type/reward_value` 映射到积分或已批准的优惠券奖励。
4. 通过统一积分/发券服务执行。
5. 使用事件 ID 幂等，重复检查不重复发放。
6. 更新 `user_achievement.reward_sent` 或对应奖励发放记录。

如果阶段五只提供 `newlyUnlocked` 而没有持久化事件，阶段六第 1 天必须补充可重放的事件/发放记录，不能只依赖一次 HTTP 响应。

### 6.5 开盒奖品接入

在阶段三现有开盒事务的明确扩展点接入，不能修改既有订单状态机：

1. 订单已合法进入开盒成功路径。
2. 服务端选择或读取 `blind_box_prize` 配置。
3. 生成唯一开盒/奖励事件 ID。
4. 插入用户奖品实例。
5. 若 `prize_type='coupon'`，调用统一发券服务。
6. 写入发放结果和失败原因。
7. 返回开盒结果所需的奖品 VO。

支付 notify 重试、管理端补单和开盒重入都不能重复生成用户奖品或用户券。

### 6.6 优惠券使用与核销

`CouponRedemptionService` 负责：

- 当前用户券、券模板、商家、订单关系校验。
- 有效期、状态和使用门槛校验。
- 一次性锁定或条件更新。
- 写核销记录和核销人。
- 更新 `user_coupon`。
- 失败释放锁定状态。
- 通过订单关联支持后续对账。

阶段六默认不提供复杂冲正；若提供，必须要求专门角色、原因、审计和原核销记录关联。

### 6.7 管理端服务

- `PartnerService`：商家列表、详情、创建、编辑、审核、上下架和统计。
- `CouponService`：模板 CRUD、上下架、库存、记录和批量发券。
- `PointService`：积分规则、积分商品、统计和排行。
- `PrizeGrantService`：用户奖品查询、发放失败重试和人工补发（如批准）。
- `AdminAuditService`：统一记录状态、配置、发券、积分、奖励和核销纠错。

商家统计的事实来源优先使用核销、订单和兑换明细聚合；`partner.total_orders`、`total_amount_cent` 只能作为缓存或展示字段，不能作为财务唯一事实。

---

## 7. 微信小程序详细开发计划

### 7.1 复用基础设施

复用：

- `miniapp/services/api.js`：用户 API 集中出口。
- `miniapp/utils/request.js`：Token、401、错误处理。
- `miniapp/utils/auth.js`：登录拦截。
- `miniapp/utils/tuge-store.js`：用户、行程、徽章和现有资产 hydration。
- `miniapp/utils/tuge-page.js`/`behaviors/tuge-page.js`：页面生命周期模式。
- `miniapp/components/tuge-overlay/`：登录、Toast 和弹层。
- `miniapp/pages/mine/`：资产入口和用户展示。
- `miniapp/pages/trips/`、开盒结果：奖品和行程关联。

建议新增领域状态模块，避免继续扩大全局 Store：

```text
miniapp/utils/wallet-store.js
miniapp/utils/partner-store.js
miniapp/utils/points-store.js
```

### 7.2 API 封装

在 `miniapp/services/api.js` 增加并以冻结后的 OpenAPI 为准：

```javascript
listMyCoupons
getMyCoupon
useMyCoupon
getMyPoints
listPointHistory
signin
listPointItems
exchangePointItem
getPrize
listPartners // 若批准用户端商家浏览
getPartner // 若批准用户端商家详情
```

列表和概览请求可使用 `{ silent: true }`；签到、使用、兑换和发起核销使用明确的 Loading、确认和错误反馈。

### 7.3 我的卡包

新增：

```text
miniapp/pages/coupon/index/
miniapp/pages/coupon/detail/
miniapp/components/CouponCard/
miniapp/components/CouponTabs/
miniapp/components/CouponUsageGuide/
```

实现：

- 未使用、已使用、已过期三类筛选。
- 分页、下拉刷新和空态。
- 展示商家、券名、优惠金额/折扣、使用门槛、有效期和使用说明。
- 用户券码和核销状态按服务端返回展示，不能前端自行判断已使用。
- 已下架商家的已发券按冻结规则展示，不隐藏真实状态。
- 使用优惠券前显示确认弹层和适用订单/商家说明。
- 使用成功刷新卡包和订单/核销结果，失败保留页面状态。
- 登录过期回到统一登录弹层。

### 7.4 积分中心与签到

新增：

```text
miniapp/pages/points/index/
miniapp/pages/points/history/
miniapp/components/PointsBadge/
miniapp/components/PointsTasks/
miniapp/components/DailySignin/
```

实现：

- 积分余额、累计获得、累计消耗。
- 积分流水按类型筛选、分页和详情。
- 每日签到按钮根据服务端状态显示可签到/已签到。
- 签到成功展示本次积分、连续天数和成就联动结果。
- 重复点击只产生一次请求，重复签到展示已签到结果。
- 积分不足、网络错误、登录失效和服务端规则调整有明确提示。
- “积分任务”只展示服务端确认可获得的任务，不能前端承诺尚未冻结的来源。

### 7.5 积分商城与兑换

新增：

```text
miniapp/pages/points/mall/
```

第一期只展示可履约的优惠券商品：

- 商品图、名称、兑换积分、剩余库存、每人限兑、有效期和状态。
- 已下架、已售罄、未开始和过期商品不可提交兑换。
- 兑换前确认积分和发放结果。
- 提交期间禁用按钮，显示处理中。
- 成功后显示兑换单号、扣除积分和新券入口。
- 发券失败显示可重试/联系客服状态，不能伪造兑换成功。
- 兑换成功后刷新积分余额、流水和卡包。

### 7.6 开盒奖品

新增：

```text
miniapp/components/BoxPrizes/
miniapp/components/PrizeCard/
miniapp/pages/prize/coupon/
```

开盒结果展示：

- 奖品名称、类型、商家、面值/权益、有效期和使用入口。
- 优惠券奖品进入“我的卡包”。
- 发放处理中、已发放、发放失败分别展示真实状态。
- 不从 `blind_box_prize` 配置表直接推断用户已经获得奖品。
- 重进页面以服务端订单/奖品实例为准，不使用本地“已中奖”标记冒充资产。

### 7.7 入口设计

不新增第六个 Tab。建议在“我的”菜单增加：

- 我的优惠券。
- 积分与奖励。
- 每日签到。

首页运营位、开盒结果和阶段五成就解锁弹窗可以进入卡包/奖品详情。若最终决定增加商城 Tab，必须另行更新 `app.json`、自定义 TabBar、原型和验收范围。

---

## 8. 管理端详细开发计划

### 8.1 复用模式

复用：

- `admin-web/src/api/index.ts`：统一请求、401、响应和 Toast。
- `admin-web/src/api/content.ts`、`transaction.ts`：API 类型和分页模式。
- `admin-web/src/stores/kitchen.ts`：现有资源 CRUD 模式；若继续膨胀则拆分领域 Store。
- `admin-web/src/components/kitchen/PageHead.vue`。
- `admin-web/src/components/kitchen/ProductCard.vue`。
- `admin-web/src/components/kitchen/KitchenDrawer.vue`、`DrawerHost.vue`。
- `admin-web/src/composables/useTable.ts`。
- `admin-web/src/views/boxes/index.vue`、`routes/index.vue`、`orders/index.vue`、`refunds/index.vue`、`stats/index.vue`。

建议新增：

```text
admin-web/src/api/partner.ts
admin-web/src/api/coupon.ts
admin-web/src/api/points.ts
admin-web/src/stores/rewards.ts
```

### 8.2 商家管理

新增：

```text
admin-web/src/views/partners/index.vue
```

功能：

- 按名称、类型、状态分页筛选。
- 创建/编辑商家。
- 审核通过、拒绝、启用、停用；拒绝原因必填。
- 详情抽屉：基本资料、优惠券数量、订单数、订单金额和状态历史。
- 佣金比例和结算类型字段按权限展示；本阶段不生成付款结算单。
- 操作后刷新真实数据，不能使用本地假统计。

### 8.3 优惠券管理

新增：

```text
admin-web/src/views/coupons/index.vue
```

功能：

- 按名称、类型、商家、状态和时间筛选。
- 创建、编辑、上下架券模板。
- 展示总量、剩余量、领取量、使用量和有效期。
- 查看领取/发放/使用记录。
- 指定用户或按数量发券；返回实际成功数、失败数和原因。
- 已经发放的券不得任意修改影响用户权益的字段。
- 批量发放和人工补发必须填写原因并记录审计。

### 8.4 积分管理

新增：

```text
admin-web/src/views/points/index.vue
```

建议分为三个区块或子页面：

- 积分商品：CRUD、库存、上下架、排序。
- 积分规则：签到、打卡、成就等已冻结规则的读取和更新。
- 积分统计：总发放、总消耗、余额分布、用户排行、签到和兑换概览。

规则表单不得展示或允许保存尚未批准的积分来源。人工调分如纳入必须有独立入口、原因、权限和审计。

### 8.5 奖品和核销管理

若阶段六验收要求管理端查看奖品发放和核销结果，新增只读或受限页面：

```text
admin-web/src/views/rewards/index.vue
admin-web/src/views/redemptions/index.vue
```

这两个页面是否纳入必须在第 1–2 天确认；不能因后端存在表就默认为必须交付。核销纠错/冲正默认不纳入 MVP。

### 8.6 路由、导航和权限

在以下文件增加页面和权限：

- `admin-web/src/constants/nav.ts`。
- `admin-web/src/router/index.ts`。
- 现有导航和标题配置。

建议分组：

```text
权益与商家
- 商家管理
- 优惠券管理
- 积分管理
```

所有敏感操作即使前端隐藏，后端仍必须返回正确的 403。

---

## 9. 账本、安全与幂等

### 9.1 服务端权威数据

客户端不能提交或决定：

- 积分余额、累计获得和累计消耗。
- 成就进度或奖励 ID。
- 优惠券状态、剩余库存和核销结果。
- 用户奖品是否已经发放。
- 商家审核结果、佣金和结算结果。

### 9.2 幂等清单

必须覆盖：

- 支付回调触发的奖品和积分。
- 阶段五成就解锁奖励。
- 每日签到。
- 阶段五打卡奖励。
- 用户领券和管理端发券。
- 积分兑换。
- 券核销。
- 核销纠错/冲正（如纳入）。
- 奖品人工补发（如纳入）。

每个动作必须定义业务键、唯一索引或条件更新、重复返回值、失败重试和补偿。

### 9.3 券码与核销安全

- 用户券码/核销码使用不可预测的随机值，不使用自增 ID 或模板 `code` 直接作为秘密凭证。
- 核销请求校验用户券、券模板、商家和订单关系。
- 禁止跨商家核销。
- 防止二维码重放；同一用户券只能成功核销一次。
- `locked` 状态必须有事务释放或超时恢复机制。
- 核销纠错需要角色、原因和审计。
- 生产环境不能继续使用宽松的 `allowedOriginPatterns("*")` 与 `allowCredentials(true)` 组合。

### 9.4 积分、库存和兑换一致性

- 账户更新和流水写入同一事务。
- 并发扣积分不能产生负余额或丢失更新。
- 并发兑换不能超过积分商品库存或券模板库存。
- 兑换发券失败时必须回滚、补偿或进入明确的待处理状态。
- 余额和流水可按用户、业务单号和时间对账。
- `partner.totalOrders` 和 `totalAmountCent` 不能作为唯一财务事实。

### 9.5 审计和隐私

以下操作写入 `admin_audit_log`：

- 商家通过、拒绝、启停和佣金修改。
- 优惠券创建、修改、上下架和人工发放。
- 积分规则修改和人工增减。
- 奖品补发。
- 核销纠错或冲正。
- 任何涉及电话、佣金、券码、核销人和收货信息的访问/导出。

---

## 10. 14 个工作日排期

| 工作日 | 任务 | 交付检查 |
|---|---|---|
| 第 1 天 | 阶段五交接复核；冻结 partner/merchant、范围、积分来源和奖励语义 | handoff 清单完成 |
| 第 2 天 | 冻结 OpenAPI、状态机、幂等键；设计 DDL、seed 和 reset | `v6-contract-freeze` |
| 第 3 天 | 修复 schema DROP；新增核销、奖品实例、签到、积分商品、兑换模型 | 空库初始化通过 |
| 第 4 天 | 实现统一发券、积分账户、流水和签到服务 | 余额/流水可对账 |
| 第 5 天 | 用户卡包、券详情、状态筛选；管理端商家和券页面骨架 | 卡包真实数据可读 |
| 第 6 天 | 商家 CRUD/审核；券模板 CRUD、库存和管理端发券 | 发券库存并发测试 |
| 第 7 天 | 积分中心、流水、签到和连续天数 | 重复签到只成功一次 |
| 第 8 天 | 积分商城、优惠券兑换、兑换状态和补偿 | 兑换后卡包出现新券 |
| 第 9 天 | 开盒奖品实例、优惠券奖品发放和奖品展示 | 重复开盒不重复发奖 |
| 第 10 天 | 成就积分联动、打卡积分事件、统一奖励幂等 | 成就奖励不重复 |
| 第 11 天 | 管理端积分商品、规则、统计和排行 | 统计来自真实流水 |
| 第 12 天 | 券使用/核销、订单关联、权限和审计 | 跨商家核销返回 403 |
| 第 13 天 | 三端联调、并发/越权/回滚、schema/seed 重跑 | 关键问题关闭 |
| 第 14 天 | 原型对照、真机/桌面验收、演示材料和阶段七交接 | 阶段六验收包归档 |

### 10.1 分工建议

| 角色 | 负责内容 |
|---|---|
| 后端 A | 契约、DDL、发券、积分、兑换、奖品、核销、权限和测试 |
| 前端 B | 小程序卡包、积分、签到、商城、兑换、奖品和真机对照 |
| 前端 C | 管理端商家、券、积分、统计、权限和桌面端对照 |

并行原则：前两天只做交接和契约门禁；第 3 天起，前后端基于冻结字段并行。积分和发券必须先形成统一服务，再接入签到、成就、开盒和兑换。

---

## 11. 测试与验收

### 11.1 原计划九项验收

- [ ] 我的卡包展示全部优惠券，可按未使用/已使用/已过期筛选。
- [ ] 每日签到正确获得积分，连续签到天数累计。
- [ ] 积分商城展示当前可兑换商品。
- [ ] 积分兑换成功后优惠券进入卡包。
- [ ] 开盒获得的优惠券正确进入卡包并可查看。
- [ ] 管理端商家入驻审核流程完整。
- [ ] 管理端创建优惠券并发放给用户，实际发放数正确。
- [ ] 管理端积分统计报表与流水可对账。
- [ ] 阶段五成就解锁与积分/奖励联动正常。

### 11.2 后端和并发测试

必须覆盖：

- 同一用户同一日期重复签到只入账一次。
- 阶段五同一成就事件重复消费不重复发奖。
- 支付 notify、补单或开盒重入不重复发券/积分/奖品。
- 并发发券不超过 `totalCount`，不产生负 `remainCount`。
- 并发兑换不超过商品和券库存。
- 并发扣积分不产生负余额或丢失更新。
- 同一用户券不能成功核销两次。
- 错误商家不能核销该券。
- 过期、下架券和停用商家按冻结规则拒绝。
- 兑换发券失败时状态、积分和补偿结果可解释。
- 非本人卡包、奖品、积分和核销记录不能访问。
- 管理角色不允许的操作返回 403。
- 人工发券、调分、补发和核销纠错写入审计。
- 余额、流水、券库存和发放记录可对账。
- 非法状态转换被拒绝。

### 11.3 数据库测试

- 空库执行 `schema.sql` 成功。
- 重复执行 reset/schema 不因新增表已存在失败。
- `seed.sql` 可在初始化后执行。
- seed 按约定可重复执行。
- 用户券、用户奖品、积分账户、流水、签到、兑换和核销演示数据相互一致。
- 关键唯一键、索引和应用层所有权校验有效。
- 失败事务不会留下错误余额、错误库存或“已成功但无资产”的记录。

### 11.4 前端构建和语法检查

```bash
cd server && mvn test -q
```

```bash
cd admin-web && npm run build
```

```bash
find miniapp -name '*.js' -print0 | xargs -0 -n1 node --check
```

并使用 Swagger/springdoc 或接口脚本核对：

- 阶段六所有路径、请求体和响应 schema。
- 401/403/404/409/422 错误。
- 分页、状态筛选、兑换和核销参数。
- OpenAPI、Controller、管理端 API 和小程序 API 三者一致。

### 11.5 原型和真机验收

小程序固定 375px 或 390×844，并在真机核对：

- 我的卡包：加载、空、未使用、已使用、已过期。
- 券详情：使用说明、核销码、使用确认、已核销。
- 积分中心：余额、流水、签到成功/已签到。
- 积分商城：商品、库存不足、积分不足、兑换确认/成功/失败。
- 开盒奖品：已发放、进入卡包、发放失败。

管理端固定目标桌面视口：

- 商家列表、创建、审核、拒绝、停用和详情统计。
- 优惠券列表、创建、上下架、发放和记录。
- 积分商品、规则、统计和用户排行。
- 加载、空、错误、403、校验失败、确认弹层和成功 Toast。

必须归档页面对照表、初始态/加载态/空态/错误态/成功态截图、关键操作录屏和偏差关闭记录。

---

## 12. 阶段交付物

### 12.1 文档和契约

- `docs/phase6-详细开发计划.md`。
- 更新后的 `docs/openapi.yaml`。
- 同步后的 `docs/接口设计.md`。
- 更新后的 `docs/数据库设计.md`。
- 修订后的 `docs/schema.sql`、`docs/seed.sql`。
- 状态机、积分规则、发券规则、核销规则和跨模块数据流说明。
- `v6-contract-freeze` 决策记录和未决问题清单。

### 12.2 后端

- 商家、优惠券、卡包、核销、积分、签到、积分商城和奖品 Controller/Service/Mapper/Entity/DTO/VO。
- 统一发券、统一积分、奖品发放和兑换服务。
- 阶段五成就奖励联动和阶段三开盒奖品接入。
- 权限、审计、库存、余额、幂等和补偿机制。
- 单元、集成、并发、越权和对账测试。

### 12.3 小程序

- 我的卡包、券详情、积分中心、积分流水、积分商城、签到和奖品页面。
- Coupon、Points、Prize 组件。
- API、领域状态模块、刷新、分页、空态和错误态。
- 真机测试和原型对照证据。

### 12.4 管理端

- 商家管理。
- 优惠券管理、发放和记录。
- 积分商品、规则、统计和排行。
- 路由、导航、API、Store、权限和审计操作。

### 12.5 演示材料

- 可重复恢复的商家、券、用户、积分、奖品和兑换 seed。
- Mock 支付、AI 关键词降级和离线演示预案。
- 三端、数据库、Redis、模型和支付宝的数据流/架构图。
- 演示脚本：选心情 → 登录 → 沙箱付款 → 开盒 → 获得优惠券 → 卡包查看 → 打卡/成就 → 积分签到或兑换 → 管理端查看数据。

---

## 13. 阶段完成定义

以下条件全部满足，阶段六才算完成：

- [ ] `v6-contract-freeze` 完成，OpenAPI、数据库、前后端实现一致。
- [ ] 商家平台管理端入驻/审核/启停/详情流程可用。
- [ ] 优惠券模板、库存、发放、用户卡包、状态筛选和使用/核销可用。
- [ ] 积分账户和流水可审计，余额不会出现负数或丢失更新。
- [ ] 每日签到和连续签到可用，重复签到幂等。
- [ ] 积分商城优惠券兑换完成，扣分、库存、发券和失败补偿可解释。
- [ ] 开盒优惠券通过用户奖品实例进入卡包，重试不重复发放。
- [ ] 阶段五成就解锁可通过统一服务联动积分/奖励，重复事件不重复发放。
- [ ] 管理端可查看商家、优惠券和积分真实统计。
- [ ] 角色、归属、券码、跨商家核销和审计规则由服务端强制执行。
- [ ] schema 可重复初始化，seed 可按约定重跑并覆盖演示路径。
- [ ] `mvn test -q`、`npm run build`、小程序 JS 语法检查通过。
- [ ] 小程序真机和管理端桌面原型对照无未关闭的产品级差异。
- [ ] 阶段七交接材料完整，未实现的结算、实物履约和高级风控已明确列出。

---

## 14. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|---|---:|---:|---|
| 两周范围过大 | 高 | 高 | 入口门禁先冻结；第一期只履约优惠券，结算/实物/商家门户后置 |
| OpenAPI 尚无完整阶段六契约 | 高 | 高 | 第 1–2 天先更新并冻结契约，禁止三端自行猜字段 |
| 商家/partner 命名分叉 | 中 | 中 | 统一采用 `partner`，页面中文显示商家 |
| 券模板与用户券混淆 | 高 | 高 | `coupon`、`user_coupon`、`coupon_redemption` 分离，分别建 VO 和状态机 |
| 缺少核销记录导致无法审计 | 高 | 高 | 新增核销事实表，用户券状态不能代替核销记录 |
| 奖品配置被误当用户资产 | 高 | 高 | 新增用户奖品实例，开盒事件设置幂等键 |
| 积分余额不可审计 | 高 | 高 | 所有变更集中到 `PointService`，账户、流水和业务单据同事务 |
| 并发发券/兑换超库存 | 中 | 高 | 条件更新/版本号/行锁和唯一幂等键；补充并发测试 |
| 阶段五成就事件不稳定 | 中 | 高 | 第 1 天 handoff reconciliation；补充持久化、可重放奖励事件 |
| seed 无法覆盖验收 | 高 | 中 | 增加用户券、奖品、积分、签到、兑换演示数据并验证重跑 |
| 券码重放或跨商家核销 | 中 | 高 | 随机券码、商家归属校验、一次性条件更新和审计 |
| 统计字段与事实不一致 | 中 | 中 | 以核销、订单、兑换和流水明细聚合为事实来源 |
| CORS 配置过宽 | 中 | 高 | 生产环境改为明确 Origin 白名单，禁止任意凭证跨域 |

---

## 15. 阶段七交接

阶段六必须把账户、资产、券、奖励和事件数据交付为可审计、可重放、可恢复的基础，不把未完成能力留在模糊状态。

### 15.1 交给阶段七的候选能力

- 完整商家门户、商家角色和独立认证。
- 商家资质、合同、账户和运营管理。
- 佣金明细、结算批次、付款、对账和导出。
- 实物积分商品、收货地址、物流、售后和退款。
- 物理盲盒奖品发货、替换和失败处理。
- 完整核销冲正、争议和退款回收。
- 积分过期、转赠、复杂限额和风控。
- 商家曝光、点击、核销量、GMV 和运营事件模型。
- 更复杂的奖励编排和多种奖励类型。
- 用户券转赠、优惠券叠加和跨商家联合权益。

### 15.2 必须留下的稳定接口和数据说明

- `partner`、`coupon`、`user_coupon`、`coupon_redemption` 的稳定关系。
- 用户奖品实例、开盒事件和发券幂等语义。
- 积分账户、流水、签到和冲正规则。
- 成就奖励到积分/优惠券的映射。
- `point_item`、`point_exchange_order` 是否已纳入及其状态。
- 未实现的结算、实物履约、冲正和高级风控接口清单。
- 数据库迁移、兼容性、seed 和回滚说明。
- 所有未决业务问题及阶段七入口条件。

---

*文档版本：v1.0*  
*更新时间：2026-09-20*  
*负责人：待定*
