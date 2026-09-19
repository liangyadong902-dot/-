# 阶段三：交易域详细开发计划

> 版本：v1.1  
> 阶段：Phase 3  
> Timebox：3 周（15 个工作日）  
> 用户端形态：原生微信小程序  
> 依据：`docs/开发计划.md` §5、`docs/功能模块设计.md` §2.3/2.6/2.7/2.8/3.8、`docs/接口设计.md` §2/§4/§5/§8、`docs/数据库设计.md`、`docs/schema.sql`、`docs/openapi.yaml`、`docs/支付宝沙箱准备.md`、`docs/页面原型.html`

> **原型还原硬性要求：** 微信小程序用户端必须与 `docs/页面原型.html` 的最终呈现和交互**一模一样**。页面结构、布局尺寸、颜色、字体、字号、字重、间距、圆角、阴影、图标、图片比例、文案、页面顺序、底部导航、弹窗、动效、加载态、空态、错误态和点击行为均不得产生产品层面的差异。小程序只是技术载体转换，不能借机改版、简化或重新设计。管理端对照 `docs/管理端页面原型.html` + `docs/管理端页面原型.js`。

---

## 1. 阶段目标与边界

**核心目标**：打通「登录 → 下单 → 支付宝沙箱付款 → notify 入账 → 开盒事务 → 行程 + 徽章」闭环，管理端能看见订单、流水和退款。

### 1.1 本阶段交付

- 用户账号：手机号验证码登录、微信登录、`/me`、退出；开盒/行程/订单必须登录，登录后回到原动作。
- 交易主链：创建待支付订单、取消、15 分钟超时、拉起沙箱支付、异步通知验签入账、开盒抽线路、行程快照、徽章解锁。
- 抽奖失败自动全额退款；用户可申请未出行退换；管理端审核通过后原路退回。
- 小程序：登录弹层、开盒确认/收银台/开盒动效/结果翻牌、行程列表与详情、订单列表（底栏）、我的页登录态与四宫格真实口径。
- 管理端：订单列表/详情、退款审核、支付流水、行程只读、补单（支付成功但未开盒）。
- 旅行日记本阶段只做**模板降级**（目的地 + 亮点拼接），完整小途智能体放到阶段四。
- 阶段验收记录、沙箱联调记录、原型对照记录。

### 1.2 明确不做

- 不实现人格测试、AI 搭子连续记忆、Spring AI 模型调用、关键词降级对话。
- 不实现社区、打卡、成就、商家、优惠券、积分。
- 不实现微信支付、购物车、多件合并、改价补差。
- 不实现用户管理完整详情（禁用/备注/导出用户）——可只读订单里的用户快照；用户管理页放到阶段四。
- 不实现 `/me/stats-detail` 展开页、编辑资料独立页；本阶段「我的」只对齐原型已有头部、四宫格、订单入口、退出、三块服务说明。
- 日记不接大模型；按钮与文案按原型保留，后端返回模板短文即可。
- 不新增业务表；不把 mock 支付当作阶段完成定义。

### 1.3 现状与工作切分

仓库里已有 Auth / Order / Trip 骨架，并曾使用 `pay.mock-enabled: true` 跑通模拟支付（见 `docs/phase3-week3-联调记录.md`）。当前默认已关闭 mock；旧闭环只是开发脚手架，**不是阶段三验收通过**。

本阶段必须：

1. 以 `docs/openapi.yaml` 冻结契约，收敛现有路径与字段差异（见 §2.2）。
2. 把入账唯一依据改成支付宝异步通知；`mock` 只留给单测和本地无密钥时的临时开关，默认关。
3. 开盒必须在同一事务内完成订单、行程、徽章、计数；未支付成功不得写 `trip`。
4. 小程序支付 UI 按原型「沙箱收银台 + 倒计时 + 确认付款」，真实资金走方案 B（外部浏览器 / 二维码）。
5. 已有代码按本计划补齐和纠偏，禁止平行再造一套订单模型。

### 1.4 实施进度

| 日期 | 批次 | 状态 | 内容 |
|------|------|------|------|
| 2026-09-19 | 第 1 批 | 已完成 | 冻结短信路径、支付请求体、退款 `kind`、管理端流水路径；`pay.mock-enabled` 改为默认关闭 |

---

## 2. 前置条件与技术约定

- 阶段一、阶段二验收通过：三端可启动，内容域接口可用，种子盲盒/线路/徽章已导入。
- `docs/openapi.yaml` 是接口字段和响应结构的唯一来源；发现冲突时先改文档再改代码。
- `docs/页面原型.html` 是用户端唯一视觉和交互基准。
- 继续使用现有表：`app_user`、`biz_order`、`payment_flow`、`refund_order`、`trip`、`user_badge`，以及阶段二的 `blind_box` / `travel_route` / `badge`。**不新增业务表。**
- 数据库金额用分，接口金额用元；转换只放在 DTO/Assembler，业务代码不散落 `/100`。
- 业务单号：订单 `T`、退款 `R`、流水 `F` + `yyyyMMdd` + 6 位日序，复用 `BizNoGenerator`。
- 订单状态只允许：`pending_pay` / `paid` / `opened` / `cancelled` / `refunded`。
- 退款单 `kind`：`draw_fail`（系统自动）/ `value_guard` / `unused`；`status`：`auto` / `pending_review` / `approved` / `rejected`。
- 行程 `validity`：`valid` / `invalid`。退款后行程无效，**不删除** `user_badge`。
- 用户端 JWT 必须登录的接口：下单、支付、取消、退款、订单、行程、日记、`/me`、`/me/stats`。
- 管理端权限由服务端强制校验：

| 动作 | 允许角色 |
|------|----------|
| 订单/行程/流水只读 | `super_admin`、`operator`、`cs`、`finance`、`analyst` |
| 退款审核、驳回 | `super_admin`、`finance`、`cs` |
| 补单 reopen | `super_admin`、`cs` |
| 订单导出 | `super_admin`、`finance`、`analyst` |

- 支付方案 B（已定）：后端返回 `payUrl` + 可选 `qrCodeUrl` / `payForm`；小程序不能提交支付宝表单，演示者在外部浏览器或扫码完成沙箱付款；小程序回前台后轮询订单。
- 入账**只认** `POST /api/v1/pay/notify/alipay` 验签通过。同步 `return_url` 只负责把浏览器带回来，不能改订单。
- `pay.mock-enabled` 默认 `false`。仅本地单测或沙箱密钥未就绪时临时打开，验收材料必须标注环境。

### 2.1 环境与配置

沙箱准备步骤以 `docs/支付宝沙箱准备.md` 为准，本阶段开发机至少具备：

| 配置 | 说明 |
|------|------|
| `alipay.sandbox=true` | 走新版沙箱网关 |
| `alipay.gateway` | `https://openapi-sandbox.dl.alipaydev.com/gateway.do` |
| `alipay.app-id` / 私钥 / 支付宝公钥 | 只放 `application-local.yml`，禁止提交 Git |
| `alipay.notify-url` | 公网 HTTPS，指向 `/api/v1/pay/notify/alipay` |
| `alipay.return-url` | 可为本机；不能当作入账 |
| `pay.timeout-minutes` | 默认 15 |
| `WECHAT_APP_SECRET` | 环境变量，禁止写入小程序 |

支付宝服务器访问不到 `localhost`。本机联调必须用 cpolar / natapp / ngrok，或已有测试机。

### 2.2 契约冻结（第 1 天必须拍板）

当前实现与 OpenAPI 已出现漂移，第 1 天选定**一条**并改文档+代码，打 tag `v3-contract-freeze`：

| 项 | 冻结前实现 | OpenAPI | 已冻结 |
|----|--------|---------|----------|
| 发短信 | `POST /api/v1/auth/sms/send` | `/api/v1/auth/sms` | **保留已实现** `/sms/send`，回写 OpenAPI |
| 支付流水 | `GET /api/v1/admin/payment-flows` | `/api/v1/admin/pay-flows` | **按 OpenAPI** `/pay-flows`，管理端 API 同步改 |
| 拉起支付 body | `{}` | `{ channel: alipay }` | **按 OpenAPI**，必传 `channel` |
| 申请退款 body | `{ reason }` | `{ reason, kind }` | **按 OpenAPI**，小程序按原型原因映射 `kind` |
| 微信登录 | `code + nickname/avatarUrl` | `{ code }` | 保留资料字段（平台不再返回真实头像，见 §5.1），OpenAPI 补字段 |

之后任何人改交易接口必须先改 `docs/openapi.yaml`。

---

## 3. 接口契约与后端交易服务

按 `controller / service / mapper / domain` 分层。统一复用 `Result<T>`、`PageResult<T>`、`BusinessException`、JWT 拦截器。

建议包结构（在现有类上拆清职责，避免 `OrderService` 无限膨胀）：

```text
server/src/main/java/com/tuge/
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── OrderController.java
│   ├── TripController.java
│   └── PayNotifyController.java          # 支付宝 notify，无 JWT
├── controller/admin/
│   └── TransactionAdminController.java
└── domain/service/
    ├── AuthService.java
    ├── OrderService.java                 # 下单 / 取消 / 过期 / 拉起支付
    ├── OpenBoxService.java               # 入账后开盒事务（可从 OrderService 拆出）
    ├── AlipaySandboxClient.java          # page.pay / refund / 验签
    ├── RefundService.java
    ├── TripService.java
    ├── UserStatsService.java             # GET /me/stats 口径
    └── AdminTransactionService.java
```

### 3.1 用户端 · 账号

| 方法 | 路径 | 关键行为 |
|---|---|---|
| POST | `/api/v1/auth/sms/send` | 校验 `1[3-9]\d{9}`；60 秒内同号拒绝；第一期固定码 `123456`（可配） |
| POST | `/api/v1/auth/login/phone` | 登录即注册；禁用号 `403`；签发 7 天 JWT |
| POST | `/api/v1/auth/login/wechat` | `wx.login` code → `jscode2session`；按 `openid` 查找或创建；可带 nickname/avatarUrl |
| POST | `/api/v1/auth/logout` | 本期可只清客户端 Token；若做黑名单则写 Redis |
| GET | `/api/v1/me` | 当前用户资料 + 称号 |
| PUT | `/api/v1/me` | 改昵称/头像/性别/城市；头像只接受 `https` 且长度限制 |
| POST | `/api/v1/me/bind-phone` | 微信用户补绑；手机号已被占用返回 `409` |

实现要求：

- 手机号唯一、openid 唯一，并发注册用库唯一索引兜底。
- `register_channel` 为 `phone` / `wechat`；微信用户后绑手机不改注册渠道。
- 更新 `last_login_at`。
- 微信头像：平台 `getUserProfile` 已失效；用户端用 `chooseAvatar` 拿临时文件。后端**不接收** `http://tmp` / `wxfile://`，只存可访问的 https；空头像保持默认。
- 禁用用户所有需登录接口返回 `403`。

### 3.2 用户端 · 订单与支付

| 方法 | 路径 | 关键行为 |
|---|---|---|
| POST | `/api/v1/orders` | `{ boxId }` → 待支付单；快照名称/分类/售价/保底；`expireAt = now + 15min` |
| GET | `/api/v1/orders` | 当前用户订单分页；`status` 可选 |
| GET | `/api/v1/orders/{orderNo}` | 详情 + 开盒行程；供支付回站轮询 |
| POST | `/api/v1/orders/{orderNo}/cancel` | 仅 `pending_pay` |
| POST | `/api/v1/orders/{orderNo}/pay` | `{ channel: alipay }`；**不改已支付**；返回 `payUrl/qrCodeUrl/payForm/expireAt` |
| POST | `/api/v1/pay/notify/alipay` | 无 JWT；RSA2 验签；幂等；成功则 `paid` 并开盒；响应纯文本 `success` |
| POST | `/api/v1/orders/{orderNo}/refund` | `{ reason, kind }`；`opened` 且行程 `valid` |

下单规则：

- 未登录 `401`。盲盒不存在或 `status!=on` 返回 `404`。
- 同一用户同一盲盒已有 `pending_pay` 或 `paid`：返回 `409`，`data.orderNo` 指向已有单，前端去支付或取消。
- 依赖表字段 `biz_order.active_key` 唯一索引挡住并发双花下单。
- 一单一盒，不支持数量字段。
- **确认弹窗未点「去支付宝付款」之前不得创建订单**（与原型一致：预览关闭不落单）。

拉起支付规则：

- 仅 `pending_pay` 且 `expireAt > now`。
- 调用沙箱 `alipay.trade.page.pay`（答辩电脑演示）或按配置 `wap.pay`。
- `out_trade_no = orderNo`，金额为元字符串，与 `price_cent` 一致。
- 写一条 `payment_flow` 可在 notify 成功时补全 `channel_trade_no`；失败/关闭也要落流水。
- `channel=mock` 仅当 `pay.mock-enabled=true`。

Notify / 开盒规则（阶段三最硬约束）：

```text
验签失败 → 不改库，不返回 success
out_trade_no 不存在 / 金额不一致 → 记流水 fail，不入账
trade_status 非成功 → 可记 closed/fail，订单保持 pending_pay
notify_id 已存在 → 直接 success（幂等）
订单已 opened/refunded → success（幂等）
订单 pending_pay → 乐观锁改为 paid → 同一事务开盒
  池中有 value_cent >= min_value_cent 且 status=on 且 category 匹配
    → 随机一条 → 写 trip 快照 → user_badge（已有则忽略）
    → 回写 order.route_id/trip_id/status=opened
    → blind_box.open_count++ / travel_route.draw_count++
  池空
    → alipay.trade.refund 全额
    → 订单 refunded，退款单 kind=draw_fail status=auto
    → 不写 trip
```

- 开盒随机必须在服务端；禁止前端传 `routeId`。
- `trip.uk_order` 保证一单一行程。
- 未支付成功（含仅同步跳回、仅前端点「模拟已付款」而 mock 关闭）**不得**产生 trip。
- 超时任务扫描 `pending_pay AND expire_at < now` 置 `cancelled`，不抽线路、不退款（未扣款）。

申请退款规则：

- `kind=unused`：已开盒、行程仍 valid、用户声称未使用。
- `kind=value_guard`：仅当行程票面 `< 售价 × 1.2`（抽奖已保证保底，此为兜底）。
- 同一订单已有待审退款单返回 `409`。
- 审核通过：调沙箱退款；订单 `refunded`；行程 `invalid`；徽章保留。

### 3.3 用户端 · 行程与统计

| 方法 | 路径 | 关键行为 |
|---|---|---|
| GET | `/api/v1/trips` | 默认 `validity=valid`；未登录 `401` |
| GET | `/api/v1/trips/{id}` | 仅本人；含亮点、包含项、徽章名、日记 |
| POST | `/api/v1/trips/{id}/diary` | 已有日记直接返回；否则模板生成，`fallback=true` |
| GET | `/api/v1/me/stats` | 见下表，禁止前端写死 |

`GET /me/stats` 口径（与 `docs/数据库设计.md` §5 一致）：

| 字段 | 口径 |
|------|------|
| tripCount | 有效行程数 |
| savedAmount | Σ（票面 − 购入价），仅 valid，单位元 |
| levelNo | `max(1, tripCount)` |
| title | 出行 0–2 旅行新手；3–7 探索者；≥8 旅行家 |
| welfareMiles | 有效开盒订单数（1 单 = 1 里程） |
| badgeCount / badgeTotal | `user_badge` / 徽章定义总数 |
| totalPaid | 有效订单实付（元） |
| destinationCount | 有效行程目的地去重 |
| monthTripCount | 当月有效行程 |
| diaryCount | `diary_text` 非空条数 |
| lastMood / favCategory / personality* | 可空，人格字段本阶段可返回空 |

日记模板示例（必须含该行程目的地与亮点，满足阶段四也将复用的降级路径）：

```text
今天在{location}走了一段{routeName}。{highlight} 购入价{price}元，票面{value}元。
—— AI生成
```

### 3.4 管理端

| 资源 | 接口 | 说明 |
|---|---|---|
| 订单 | `GET /api/v1/admin/orders` | 单号/用户/状态/渠道/时间筛选 |
| 订单 | `GET /api/v1/admin/orders/{orderNo}` | 用户、快照、流水、行程、退款 |
| 订单 | `GET /api/v1/admin/orders/export` | CSV，按权限 |
| 订单 | `POST /api/v1/admin/orders/{orderNo}/reopen` | 仅 `paid` 且无 trip：补开盒或标记失败退款 |
| 退款 | `GET /api/v1/admin/refunds` | 状态、kind 筛选 |
| 退款 | `GET /api/v1/admin/refunds/{refundNo}` | 详情 |
| 退款 | `POST .../approve` `POST .../reject` | 通过原路退；驳回必填原因 |
| 流水 | `GET /api/v1/admin/pay-flows` | 按单号、渠道、结果 |
| 行程 | `GET /api/v1/admin/trips` | 只读；可按 validity、routeId |

补单：渠道已成功、系统停在 `paid`（notify 后开盒崩溃）时，客服可 reopen 重入开盒事务，必须幂等。

### 3.5 后端测试必须覆盖的用例

- 未登录下单 401；下架盲盒下单 404。
- 同一用户同一盲盒并发两笔下单，只有一笔成功，另一笔 409。
- 待支付超时后变为 cancelled，无 trip。
- mock 关闭时，调用 pay 不把订单改为 paid。
- 伪造 notify（错签、错金额、重复 notify_id）均不二次开盒。
- 合法 notify：订单 opened，trip 快照字段与线路一致，徽章点亮，open_count/draw_count +1。
- 该分类全部线路下架后再支付：自动退款，订单 refunded，无 trip。
- 退款审核通过后行程 invalid，徽章仍在，stats 的出行/省钱/公益里程回落。
- 无权限角色审核退款 403。
- 金额分转元无精度误差。

---

## 4. 管理端实现计划

复用阶段一布局、Axios、`useTable`、厨房风格组件；**列表成功态禁止再走本地 mock 订单**。对照管理端原型的订单小票、退款审核、流水表。

### 4.1 订单 `views/orders/index.vue`

- 筛选：状态芯片（全部/待支付/已支付/已开盒/已取消/已退款）、关键字（单号/昵称/手机）、时间范围。
- 列表：单号、用户、盲盒、实付、渠道、状态、开盒结果线路、时间、详情。
- 详情抽屉：盲盒快照（不受后续改价影响）、支付时间、外部单号、行程、退款。
- `paid` 且无行程时显示「补单」。
- 导出按钮对接 `/admin/orders/export`；无权限隐藏或 403 提示。

### 4.2 退款 `views/refunds/index.vue`

- 待审 / 已通过 / 已驳回 / 系统自动（`draw_fail` 只读）。
- 通过、驳回（原因必填）；通过后刷新订单与行程。
- 展示用户、订单号、金额、kind、申请时间。

### 4.3 支付流水（可并入订单详情或独立页）

- 流水号、订单号、渠道、外部单号、金额、success/fail/closed、时间。
- 用于对账演示：渠道成功但系统未开盒的记录可从详情点补单。

### 4.4 行程 `views/trips/index.vue`

- 只读列表：线路名、用户、购入价、票面、validity、开盒日期。
- 不提供删除、改线路。

---

## 5. 微信小程序实现计划

### 5.1 登录

原型登录是**首页底栏弹层** `#loginModal`，不是独立视觉体系。继续用 `tuge-overlay` 登录 sheet，文案、输入、按钮尺寸对齐原型。

| 项 | 要求 |
|----|------|
| 手机号 + 验证码 | 演示码固定 123456；错误提示样式对齐原型 `.login-err` |
| 微信快捷登录 | `button open-type="chooseAvatar"`；禁止再调已失效的 `wx.getUserProfile` 当真头像 |
| 登录后动作 | `loginAfter`：`unbox` 回到开盒确认；`orders` 打开订单；`trips` 切行程 Tab |
| 游客 | 可逛首页、看图鉴定义；点开盒/行程/订单先登录 |
| 退出 | 「我的」退出后清 Token；服务端订单行程保留，再登录恢复 |

头像显示：选中的微信头像必须出现在「我的」头像圈；本地临时文件先落盘再绑定 `<image>`，`/me` 空头像不得覆盖本地可用头像。

### 5.2 开盒与支付（对齐原型 `#unboxModal`）

步骤与原型一致，不得增减：

1. **confirm**：封面、开盒售价、承诺保底、「确认下单，去支付宝付款」。此时才 `POST /orders`。
2. **pay**：订单号、应付、倒计时 `15:00`、支付宝沙箱说明、「模拟支付宝已付款」在 **mock 关闭时必须改为「去支付宝付款」**（复制链接 / 展示二维码 / 打开外部浏览器）。保留「取消订单」「稍后再付」。
3. **drawing**：支付成功后自动进入，礼盒脉冲约 1.2s，文案「小途正在拆开纸盒… / 保底线路匹配中」。
4. **result**：线路图、名称、情绪文案、目的地、票面价值、「收下并去行程查看」。

轮询：回前台 `onShow` 以及支付后每 1.5–2s `GET /orders/{orderNo}`，直到 `opened` / `refunded` / `cancelled`，超时仍待支付则保持收银台。

```javascript
// 回站轮询示意：入账以服务端状态为准，前端不得本地抽线路
function pollOrder(orderNo) {
  return api.getOrder(orderNo).then((order) => {
    if (order.status === 'opened') return showResult(order.trip)
    if (order.status === 'refunded') return showDrawFail()
    if (order.status === 'cancelled') return showExpired()
    return wait(1800).then(() => pollOrder(orderNo))
  })
}
```

- 展示金额用接口快照，不用首页卡片上可能已过期的价格。
- 同一盲盒 409 时引导「继续支付已有订单」或先取消。
- 分类线路全下架导致的自动退款：结果态提示与原型失败文案一致，不伪造线路。

### 5.3 行程页 `pages/trips`

- 未登录：原型空态 + 「去登录」。
- 已登录：`N 次出行` 只统计 valid；卡片字段对齐原型（线路名、目的地、日期、购入价、票面、「已解锁」）。
- 已退款行程默认不出现。
- 点击打开详情底栏：亮点、包含服务、日记按钮（生成中禁用）。
- 「收下并去行程查看」必须 `switchTab` 到行程。

### 5.4 订单底栏（原型 `#orderModal`，不是新 Tab）

- 筛选：全部 / 待支付 / 已开盒 / 退款（与原型 chip 文案一致）。
- 待支付：继续支付、取消。
- 已开盒：查看行程、申请退换（原因 chips 对齐原型）。
- 申请退款提交 `kind`：未出行 → `unused`；保底兜底 → `value_guard`。

### 5.5 「我的」页交易相关

- 登录前后头部、四宫格、菜单「我的订单 / 申请退换 / 登录或退出」对齐原型。
- 四宫格读 `GET /me/stats`，走完真实开盒后出行次数、累计省钱、等级、公益里程按口径变化。
- 服务说明三块文案保持原型，不改字。

社区 Tab 本阶段仍占位，不做社交接口。

---

## 6. 三周排期与依赖

| 工作日 | 任务 | 交付检查 |
|---|---|---|
| 第 1 天 | 阶段二复核；契约漂移拍板；沙箱 APPID/密钥/穿透地址打通；权限矩阵写入拦截器 | tag `v3-contract-freeze`；notify-url 可被外网 POST |
| 第 2–3 天 | 账号接口收口：短信频控、微信 code2session、禁用号、`/me` | 手机 `123456` 与微信登录均可拿 JWT |
| 第 3–5 天 | 下单/取消/超时任务/active_key 并发；pay 接口不入账 | 单测覆盖 409 与 15 分钟取消 |
| 第 5–8 天 | AlipaySandboxClient、notify 验签幂等、开盒事务、抽奖失败自动退 | 沙箱付一笔后库中有 trip；错签不入账 |
| 第 6–9 天 | 小程序登录弹层、开盒四步、轮询、二维码/链接支付、行程页 | 开发者工具走完 mock 与沙箱各一条 |
| 第 8–11 天 | 订单底栏、退款申请、我的四宫格、日记模板 | 刷新/杀进程后行程与徽章仍在 |
| 第 9–12 天 | 管理端订单/退款/流水/行程/补单/导出；角色 403 | 审核通过后行程 invalid、统计回落 |
| 第 13 天 | 三端联调：改价不影响已下单快照；全下架开盒自动退 | 联调记录 |
| 第 14 天 | 原型逐页对照：登录、开盒 confirm/pay/drawing/result、行程、订单、我的 | 对照表无未关闭差异 |
| 第 15 天 | 回归、OpenAPI 校验、验收材料、关闭 mock 默认值 | 阶段三验收通过 |

并行原则：后端先冻结状态机和 notify 语义；管理端与小程序在契约稳定后并行。支付宝密钥与穿透地址由后端 A 在第 1 天就绪，否则第 5–8 天会被阻塞。

### 6.1 分工建议（三人）

| 角色 | 负责 |
|------|------|
| 后端 A | 契约、沙箱、notify、开盒事务、超时任务、单测 |
| 前端 B | 小程序登录/开盒/支付/行程/订单/我的 |
| 前端 C | 管理端订单/退款/流水/行程/补单，协助联调 |

### 6.2 工时估算

| 模块 | 预计 | 依赖 |
|------|------|------|
| 契约冻结 + 沙箱环境 | 1 天 | 支付宝账号、穿透 |
| 账号域收口 | 2 天 | JWT 骨架 |
| 订单状态机 + 超时 | 2 天 | 表结构 |
| 沙箱支付 + notify + 自动退 | 3 天 | 公网 notify |
| 开盒事务 + 徽章 + 统计 | 2 天 | 线路池 |
| 小程序交易 UI | 4 天 | 支付返回字段 |
| 管理端交易页 | 3 天 | 管理端接口 |
| 联调 / 原型对照 / 验收 | 3 天 | 三端就绪 |
| **合计（含并行）** | **约 15 个工作日** | |

---

## 7. 测试计划与验收标准

### 7.0 原型一致性验收（硬性门槛）

以 `docs/页面原型.html` 为基准，固定 375 视口（或开发者工具 iPhone 对齐 390×844 再换算），对以下状态截图对照：

- 登录弹层：未填、错误码、成功关闭。
- 开盒 confirm / pay（倒计时）/ drawing / result。
- 行程：未登录、空列表、有卡、详情底栏、日记生成中与完成。
- 订单底栏：空、待支付操作、已开盒操作、退换原因。
- 我的：游客、已登录、四宫格数字。

对比项与阶段二相同：结构顺序、尺寸、颜色、字体、文案、动效时长。存在未确认可见差异时不得标记阶段三通过。

管理端对照厨房风订单小票、退款表、详情抽屉。

### 7.1 总计划给定的阶段三验收（必须全部勾上）

- [ ] 小程序完成一次**真付款**：选盲盒 → 登录 → 下单 → 沙箱收银台 → 付款 → 回站 → 自动开盒 → 翻牌出现线路
- [ ] 刷新或杀掉小程序重进，「行程」里该线路还在，「图鉴」对应徽章已点亮
- [ ] 未支付成功时后端绝不产生 `trip`
- [ ] 待支付单 15 分钟后自动 `cancelled`
- [ ] 把某分类的所有线路下架后开盒：自动全额退款、订单 `refunded`
- [ ] 管理端能看到这笔订单，状态、实付金额、开盒线路、支付流水全部正确

### 7.2 补充验收

- [ ] 同一用户同一盲盒未完成单不可重复创建，前端能继续支付
- [ ] 已下单后管理端改售价，订单快照与实付不变
- [ ] 用户申请未出行退换，财务/客服通过后行程无效，徽章仍在，四宫格出行与公益里程回落
- [ ] `cs` 可补单；`operator` 审核退款返回 403
- [ ] 日记按钮生成含目的地与亮点的短文，标注「—— AI生成」
- [ ] 默认配置 `pay.mock-enabled=false`；演示若必须 mock，验收记录单独声明且不算闭环通过
- [ ] OpenAPI 与实现路径一致，springdoc 可打开交易接口

### 7.3 沙箱专项手工路径

1. 配置 `application-local.yml` + 启动穿透，确认支付宝开放平台 notify-url。
2. 小程序下单 → 展示 payUrl/二维码 → 用**沙箱买家**在电脑收银台付款（正式支付宝 App 付不了沙箱单）。
3. 后端日志出现验签成功；`payment_flow.notify_id` 唯一写入。
4. 重复再 POST 同一 notify，订单不会开出第二条行程。
5. 管理端核对实付（元）= 盲盒快照售价。

---

## 8. 阶段交付物

- 后端：账号、订单、支付客户端、notify、开盒事务、退款、超时任务、统计、管理端交易接口与测试。
- 管理端：订单、退款、流水、行程只读、补单。
- 小程序：登录、开盒四步、支付回站轮询、行程、订单底栏、我的交易态。
- 更新后的 `docs/openapi.yaml`（含冻结差异）。
- `docs/phase3-联调记录.md`（沙箱环境、notify 样例、mock 是否关闭）。
- 原型对照记录（登录/开盒/行程/订单/我的）。
- 已知问题清单（转入阶段四的项必须写明）。

---

## 9. 阶段完成定义

以下条件全部满足后，阶段三才算完成：

- 入账只来自支付宝验签 notify（或验收记录中明确的、已关闭默认值的 mock 应急，且不替代沙箱主路径）。
- 支付成功后同一事务写入行程与徽章；失败/取消/超时均无 trip。
- 杀进程重进后行程、徽章、订单状态与数据库一致，不以本地缓存冒充交易成功。
- 管理端能解释每一笔：谁、买了什么、付了多少、抽中哪条、有没有退。
- 用户端相关弹层与页面完成原型对照，无未关闭可见差异。
- 契约、联调记录、截图和问题清单已归档。

---

## 10. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 支付宝 notify 打不到本机 | 高 | 订单一直待支付 | 第 1 天必须有公网 HTTPS；备用测试机 |
| 沙箱新旧网关混用 | 中 | 下单失败 | 只用 `openapi-sandbox.dl.alipaydev.com` |
| 正式支付宝 App 付沙箱单 | 高 | 演示当场失败 | 脚本写明：电脑收银台 + 沙箱买家；备用录屏 |
| 微信头像选了仍不显示 | 中 | 我的页验收卡死 | 临时文件同步 copyFile；`/me` 空 URL 不覆盖本地头像 |
| 开盒事务与 notify 重入 | 中 | 双行程 | `notify_id` 唯一 + 订单乐观锁 + `trip.uk_order` |
| 阶段三工作量反弹 | 中 | 拖期 | 人格/AI/用户管理详情一律不准塞进本阶段 |
| mock 开关忘记关掉 | 高 | 假闭环混过验收 | 验收当天检查 yml；主路径禁止 mock |

---

## 11. 下一步

阶段三验收通过后，进入**阶段四：用户资产与 AI**。

**阶段四前置依赖**：

- [ ] 阶段三全部验收标准通过（含一次沙箱真付款）
- [ ] 行程快照与 `/me/stats` 口径已稳定，可供人格/小途推荐复用
- [ ] 日记模板降级可用，阶段四只替换为模型生成
- [ ] 交易接口冻结，阶段四不得改订单状态机

---

*文档版本：v1.1*  
*更新时间：2026-09-19*  
*负责人：待定*
