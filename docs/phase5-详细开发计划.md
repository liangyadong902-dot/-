# 阶段五：社交增强与双端原型全量对齐详细开发计划

> 版本：v1.3
> 阶段：Phase 5  
> Timebox：4 周（20 个工作日，含 2 天联调与验收缓冲）
> 用户端形态：原生微信小程序  
> 依据：`docs/开发计划.md` §7、`docs/phase4-详细开发计划.md`、`docs/功能模块设计.md`、`docs/页面原型.html`、`docs/管理端页面原型.html`、`docs/管理端页面原型.js`、`docs/管理端与用户端对齐优化规格.md`、`docs/schema.sql`、`docs/seed.sql`、`docs/openapi.yaml`

> **原型还原硬性要求：** 用户端必须逐页覆盖 `docs/页面原型.html` 中的首页、商品、社区、AI、行程、图鉴、我的及全部详情/弹层/交易状态；开盒动画、支付轮询、订单、退款和各模块详情页不能用占位页或普通 Toast 代替。管理端必须逐模块覆盖 `docs/管理端页面原型.html`、`docs/管理端页面原型.js` 中的列表、筛选、详情 Drawer、状态操作和跨模块联查。两端都必须沿用既有视觉 Token、字体、颜色、间距、圆角、阴影、图标、文案和交互语言；加载、空数据、错误、登录拦截、权限、超时、重试和成功状态均属于验收范围。

---

## 1. 阶段目标与现状

### 1.1 阶段目标

建设“社区内容护城河 + 打卡留存 + 成就激励”闭环：

```text
有效行程
   │
   ├── 景点打卡 ──> 照片 / 备注 / 海报 / 分享
   │                  │
   │                  └──> 成就进度与解锁
   │
   └──> 社区发帖 ──> 话题 / 点赞 / 评论 / 收藏
                         │
                         └──> 达人榜与内容沉淀
```

### 1.2 当前实现状态

本阶段不是在已有社交模块上补细节，而是建立一个新领域：

- `miniapp/pages/community/index` 仍是“社区 - 功能开发中”占位页。
- server 尚无社区、打卡、成就对应的 Controller、Service、Entity、Mapper。
- admin-web 尚无帖子审核、话题、打卡、成就管理页面和 API。
- `docs/schema.sql` 已预留 `checkin`、`achievement`、`user_achievement`、`community_post`、`post_interaction`、`topic`、`user_topic_follow`、`checkin_like` 等表。
- `docs/seed.sql` 已包含演示帖子、打卡、话题和成就数据，但部分计数与明细并不一致。
- `docs/openapi.yaml` 尚未定义本阶段新的资源路径和 schema，必须先完成契约冻结。
- 阶段四提供用户身份、有效行程、徽章、统计和权限基础；本阶段不得修改交易状态机。
- 当前 `miniapp/app.json` 只注册首页、AI、社区、图鉴、行程、我的和登录；商品广场、商品详情、完整攻略、购物车、支付记录、帖子详情、发布、打卡和成就等尚无独立页面注册。
- 当前 `miniapp/components/tuge-overlay/` 已承载开盒确认、支付、抽取、结果、人格测试、行程详情、订单、资料、登录和退款，但复杂详情全部堆在一个弹层组件内，缺少独立页面的深链、滚动、键盘和返回栈能力。
- 当前小程序抽取态只有脉冲图标/文字，`miniapp/utils/tuge-store.js` 在 500ms 后直接切结果；与用户端原型约 2700ms 的盒体、盒盖、路线卡、光线、彩纸、进度条和文案轮换动画不一致。
- 当前交易调用已经具备创建订单、支付宝沙箱链接/二维码、15 分钟倒计时、支付状态轮询、继续支付、取消、退款和自动退语义；本阶段不重写业务规则，但必须补齐全部页面反馈、异常恢复和双端状态对应。

### 1.3 本阶段交付

- 社区发现页：帖子双列/瀑布流、下拉刷新、上拉加载。
- 发帖：正文、图片、话题、地点、关联盲盒/打卡/行程。
- 帖子详情：点赞、收藏、评论和回复。
- 话题广场：话题列表、话题筛选、话题计数。
- 达人榜：按发帖、打卡、影响力和周/月/总周期排序。
- 景点打卡：从本人有效行程进入，地点、照片、备注、海报和分享。
- 我的打卡列表、打卡详情、打卡点赞和打卡排行榜。
- 成就定义、用户成就进度、解锁提示和成就详情。
- 管理端帖子审核、话题管理、打卡查询/统计、成就 CRUD/统计。
- 图片上传、内容可见性、权限、审计、幂等和跨用户隔离。
- 用户端首页、商品广场、商品详情、完整攻略、购物车、登录/资料、订单/订单详情、支付记录、退款、开盒动画/结果、行程详情、AI 和“我的”按原型补齐。
- 小程序新增缺失页面注册与稳定深链；复杂业务从超大弹层拆成独立页面或独立组件，弹层只保留短确认流程。
- 用户端/管理端共用视觉 Token、字体角色、间距/圆角/阴影档位、组件状态和响应式规则，并建立逐页截图基线与差异台账。
- 管理端工作台、统计、盲盒、线路/攻略、徽章、运营位、AI、人格测试、社区、评论、打卡、订单、退款、行程、用户、系统设置、视觉规范全模块对照。
- 阶段五联调、原型对照、数据库重置/seed 验证和阶段六交接材料。

### 1.4 双端原型基线

本阶段实现以 2026-09-20 更新后的两份可交互原型为页面和交互基线：

| 端 | 原型文件 | 作用 | 实施约束 |
|---|---|---|---|
| 用户端 | `docs/页面原型.html` | 用户信息架构、社区内容流、发布、详情、收藏、商品与行程跳转 | 小程序负责还原移动端结构与状态，不照搬原型中的内联 JavaScript |
| 管理端 | `docs/管理端页面原型.html`、`docs/管理端页面原型.js` | 登录、角色、侧栏、内容审核、评论审核、打卡记录及跨模块联查 | Vue 管理端负责还原高信息密度桌面工作台，不复制用户端移动布局 |
| 对齐说明 | `docs/管理端与用户端对齐优化规格.md` | 用户端内容、商品、线路、订单、行程与管理端数据口径 | 正式实现改为 API/数据库联动，不以 `localStorage` 作为生产数据源 |

原型是产品行为基线，OpenAPI 是数据契约基线。若两者冲突，先登记差异并完成产品决策，不允许前端自行删减原型流程，也不允许后端字段反向改变页面语义。

#### 1.4.1 用户端页面地图

用户端原型已经形成完整的浏览、交易、内容和资产路径：

| 层级 | 页面/入口 | 原型中的主要内容 | Phase 5 处理方式 |
|---|---|---|---|
| 一级 | 首页 | 今日特选、心情筛选、旅行分类、运营横幅、人气盲盒、图鉴入口 | 复用；社区发布关联盲盒时读取同一商品数据 |
| 一级 | 商品广场 | 分类筛选、商品卡、加入购物车、立即开盒 | 新增独立小程序页；帖子详情“抽同款”跳转到商品详情/开盒 |
| 一级 | 旅途社区 | 发现、关注、话题、达人、分类 Chip、双列内容流、发布按钮 | Phase 5 核心实现 |
| 一级 | AI 搭子 | 历史对话、快捷问题、推荐卡和输入区 | 复用；本阶段不让 AI 自动发帖或代替用户互动 |
| 一级 | 我的 | 用户资料、四项统计、订单、图鉴、支付记录、收藏入口 | 新增“我的收藏/我的打卡/我的成就”入口 |
| 二级 | 商品详情 | 售价、保底、服务包含、主题攻略、购物车和立即开盒 | 新增独立小程序页，作为所有商品入口和社区关联内容的目标页 |
| 二级 | 出行攻略 | 概览、分时行程、景点、交通、餐住、费用、清单、Plan B、安全和 FAQ | 新增独立小程序页；打卡地点与有效行程以线路/行程快照为准 |
| 二级 | 行程/图鉴 | 已解锁线路、完整攻略、旅行日记、徽章进度 | 增加打卡入口；徽章与行为成就保持概念分离 |
| 二级 | 社区帖子详情 | 作者、关注、多图、正文、标签、地点、关联盲盒、评论、点赞、收藏、分享 | Phase 5 核心实现 |
| 弹层原型/独立实现 | 发布页 | 最多 9 图、标题、500 字正文、话题、地点、关联盲盒、发布 | 小程序使用独立页面，失败保留草稿 |

原型底栏当前展示“首页 / 商品 / 社区 / AI 搭子 / 我的”，而小程序现状为“首页 / AI 搭子 / 社区 / 行程 / 我的”。第 2 天契约冻结时必须同时冻结正式 TabBar；本计划默认不在 Phase 5 重排现有小程序底栏，商品、图鉴、行程继续通过页面内入口访问，社区保持一级入口。

#### 1.4.2 管理端页面地图

管理端原型采用“运营后厨”桌面结构：左侧分组导航、顶部云朵标题与全局搜索、中间数据工作区、右侧详情抽屉、全局 Toast。Phase 5 直接相关页面如下：

| 导航分组 | 页面 | 原型能力 | Phase 5 正式实现 |
|---|---|---|---|
| 橱窗 | 工作台 | KPI、待办、热门盲盒、退款/社区/攻略直达 | 增加待审核帖子、今日打卡、成就解锁数及可点击待办 |
| 内容 | 社区内容 | 全部/待审核/已发布/精选/已下架筛选，帖子表格和审核抽屉 | 接真实分页 API；审核通过、精选、下架均写审计 |
| 内容 | 评论审核 | 评论、关联帖子、用户、来源、举报原因、状态和处置 | 接评论/举报状态；与帖子审核状态分离 |
| 内容 | 打卡记录 | 地点、用户、时间、成就和海报状态 | 扩展照片、线路、行程、位置、点赞和详情抽屉 |
| 配方 | 徽章管理 | 十二枚线路徽章、关联线路和解锁量 | 继续管理线路徽章；行为成就新增独立页面或明确独立页签 |
| 账单 | 订单支付/退款审核/行程记录 | 用户、盲盒、支付、开盒结果、退款、有效行程 | 社区关联对象和打卡归属的只读联查来源 |
| 客人 | 用户管理 | 身份、偏好、资产、成长四层档案 | 增加帖子、评论、打卡、成就数量及内容跳转 |

管理端原型中的角色选择为“超级管理员 / 运营 / 客服”，正式角色仍以服务端 `super_admin/operator/cs/finance/analyst` 为准。页面显示权限、路由权限与接口权限必须来自同一权限映射。

### 1.5 Phase 5 原型闭环

```text
用户端有效行程
  ├─ 去打卡 → 上传照片/备注 → 打卡成功 → 成就检查 → 解锁弹窗/分享海报
  └─ 发社区笔记 → 关联地点/盲盒/行程 → 待审核或直接发布
                                      │
                                      ▼
管理端工作台待办 → 社区内容审核 / 评论处置 / 打卡查询
                                      │
                                      ▼
用户端发现流更新 → 点赞 / 收藏 / 评论 / 关注 → 我的资产沉淀
```

跨端验收不能只证明两个页面分别可用，必须证明同一条帖子、评论、打卡、成就记录在用户端和管理端展示的是同一 ID、同一状态和同一计数口径。

### 1.6 全量页面原型与小程序落地清单

下表是第五阶段用户端页面的最小完整范围。“复用”表示保留现有页面并补齐状态，“新增”表示必须注册真实小程序页面；原型中的长内容或复杂操作即使当前由 `tuge-overlay` 展示，也不能因此省略详情页面。

| 用户任务 | HTML 原型入口 | 当前小程序 | Phase 5 落地页面/组件 | 必须完整覆盖 |
|---|---|---|---|---|
| 浏览首页 | `tab-home` | `pages/index/index` | 复用首页 | 品牌头、今日特选、搜索、心情/分类筛选、会员横幅、人气推荐、图鉴入口、加载/空/错误态 |
| 浏览商品广场 | `tab-market` | 无独立页 | 新增 `pages/market/index` | 全部/周边/省内/跨省/主题筛选，商品卡、购物车角标、加入购物车、立即开盒 |
| 查看商品 | `tab-product` | 由首页和弹层间接承载 | 新增 `pages/product/detail` | 封面、名称、描述、售价、保底、适合心情、服务包含、主题攻略、加购、立即开盒、下架态 |
| 查看完整攻略 | `tab-guide` | 行程弹层只展示部分 | 新增 `pages/guide/detail` | 概览、分时线路、逐景点看点/提醒、交通、餐住、费用、行前清单、Plan B、安全、FAQ、版本快照 |
| 管理购物车 | `tab-cart` | 无 | 新增 `pages/cart/index` | 商品增删、数量、失效商品、金额、空态、登录恢复、结算；盲盒仍按冻结规则逐单创单/开盒 |
| 登录与资料 | `loginModal`、我的资料入口 | `pages/login/login` + 资料弹层 | 复用登录页；新增或保留轻量资料编辑组件 | 微信/手机号登录、验证码、协议、错误态、登录后恢复原动作、昵称/头像/手机号、退出 |
| 查看订单 | `orderModal` | 订单弹层 | 新增 `pages/orders/index` | 全部/待支付/已开盒/退款筛选、状态、金额、时间、继续支付、取消、看行程、申请退款 |
| 查看订单详情 | 订单卡及管理端 `showOrder` 对应 | 无独立页 | 新增 `pages/orders/detail` | 订单号、商品快照、金额、渠道、倒计时、支付流水、开盒结果、关联行程、退款进度和可用动作 |
| 查看支付记录 | `tab-records` | 无 | 新增 `pages/payment-records/index` | 支付批次、订单号、商品、渠道、金额、成功/失败/退款状态、时间、空态和异常态 |
| 支付订单 | `stepPay` | `tuge-overlay` 已有基础 | 新增 `components/order-payment/`；必要时独立页 `pages/payment/cashier` | 15 分钟倒计时、支付宝沙箱链接/二维码、复制/外部浏览器提示、轮询、重试、稍后支付、取消、超时 |
| 开启盲盒 | `unboxModal`：`stepConfirm → stepPay → stepDrawing → stepResult` | `tuge-overlay` 有简化流程 | 新增 `components/unbox-flow/`、`components/unbox-animation/` | 确认、创单、支付、抽取、结果、接受线路；动画期间禁关；断网/重入/重复点击可恢复 |
| 查看/申请退款 | `refundModal` | 退款弹层 | 新增 `pages/refunds/apply`、`pages/refunds/detail` 或同等独立流程 | 原订单、原因、说明、可退校验、审核中、通过、驳回原因、自动退、原路退回 |
| 查看行程 | `tab-trips` | `pages/trips/index` | 复用并补齐 | 有效/退款行程、空态、路线/目的地/日期/价格/票面、详情、完整攻略、打卡入口 |
| 查看行程详情 | `tripDetailModal` | `tuge-overlay` | 新增 `pages/trips/detail` | 线路亮点、分时路线、景点、服务包含、价格、状态、攻略、打卡、AI 日记、退款失效提示 |
| 生成 AI 日记 | 行程详情 `generateDiary()` | 行程弹层基础能力 | 归入 `pages/trips/detail` | 生成中、成功、失败重试、内容安全、复制/分享；必须标明 AI 生成 |
| 使用 AI 搭子 | `tab-ai` | `pages/ai/index` | 复用并对齐 | 新会话、历史折叠/切换、快捷问题、输入发送、推荐商品/线路卡、失败降级、禁止代开盒 |
| 查看旅行图鉴 | `tab-badges` | `pages/badges/index` | 复用并对齐 | 12 枚徽章、锁定/解锁、进度、空态、人格测试入口；与行为成就分离 |
| 完成人格测试 | `testModal` | `tuge-overlay` | 可保留独立弹层或新增 `pages/personality-test/index` | 5 题进度、逐题选择、结果、推荐方向、重测、返回首页/商品，不丢历史结果 |
| 浏览社区 | `tab-community` | 占位页 | 重建 `pages/community/index` | 发现/关注/话题/达人、分类、瀑布流、发布、收藏入口及全部状态 |
| 查看帖子 | `postDetail` | 无 | 新增 `pages/community/post-detail` | 作者/关注、多图、正文、话题、地点、同款盲盒、评论/回复、赞藏分享、下架态 |
| 发布帖子 | `postModal` | 无 | 新增 `pages/community/publish` | 最多 9 图、30 字标题、500 字正文、话题、地点、关联盲盒/行程/打卡、草稿、审核状态 |
| 查看收藏/关注 | 社区收藏入口、`我的` | 无完整页 | 新增 `pages/community/collections`，关注流复用社区页 | 收藏列表/空态/取消收藏、关注作者内容、取消关注后的列表同步 |
| 打卡与成就 | 行程/我的新增入口 | 无 | 新增 `pages/checkin/**`、`pages/achievements/**` | 打卡创建/结果/海报/详情/榜单；成就列表/详情/进度/解锁弹窗 |
| 个人中心 | `tab-mine` | `pages/mine/index` | 复用并补齐 | 资料、四项统计、订单、行程、图鉴、支付记录、购物车、收藏、打卡、成就、客服/规则、退出 |

页面拆分遵循以下规则：

- 只包含一次确认、内容不超过一屏、无键盘输入的流程可使用弹层。
- 商品详情、攻略、订单详情、退款、行程详情、帖子详情、发布、购物车等需要长滚动、键盘、分享、深链或中断恢复的流程必须使用独立页面。
- 每个独立页面都必须有 `loading/empty/error/ready/submitting/success` 中适用的状态，登录后回到原页面并恢复待执行动作。
- 所有入口必须以真实 `boxId/orderNo/paymentNo/routeId/tripId/postId/userId` 导航，禁止靠全局“当前对象”作为唯一定位方式。

---

## 2. 范围与边界

### 2.1 明确包含

| 领域 | 本阶段能力 |
|---|---|
| 社区 | 帖子列表、详情、发布、图片、话题、点赞、收藏、评论、回复、分享计数、达人和单向关注 |
| 打卡 | 有效行程关联、位置描述、可选 GPS、照片、备注、海报、列表、详情、点赞、排行 |
| 成就 | 打卡/行程/徽章/发帖/消费进度、解锁、用户进度、解锁弹窗、管理配置 |
| 话题 | 话题列表、帖子筛选、管理端 CRUD |
| 排行 | 发帖榜、打卡榜、影响力榜；周/月/总榜 |
| 管理端 | 帖子审核、话题管理、打卡管理与统计、成就管理与达成率 |
| 原型全量对齐 | 用户端全部一级/二级/详情/弹层/交易状态；管理端 17 个原型模块及详情 Drawer、筛选、动作、权限和联查 |

### 2.2 明确不做

以下属于阶段六“商家合作与积分”，不得在阶段五隐式加入：

- 商家入驻、商家详情、佣金结算。
- 优惠券创建、发放、核销、用户卡包。
- 积分余额、签到积分、积分商城、积分兑换。
- 盲盒奖品配置和商家奖品兑现。
- 商家统计、合作方运营和结算。

虽然 schema/seed 已预留 `partner`、`coupon`、`user_coupon`、`user_point`、`point_log`，但这些表不代表本阶段获得业务范围。阶段五最多保留成就的 `reward_type`、`reward_value`、`reward_sent` 字段，完整奖励兑现交由阶段六。

本阶段也不做：

- 好友关系、私信、拉黑和通知中心；Phase 5 只实现原型所需的单向关注/取消关注和关注流。
- 改变订单、支付、退款或开盒的既有业务语义；本阶段必须实现并验收这些状态的完整用户界面、轮询、恢复、详情和管理端联查。
- AI 自动发帖、自动点赞、自动打卡或修改用户资产。
- 完整的地理围栏强校验；GPS 校验作为可选能力，若不实现必须在契约中明确。

### 2.3 实施边界

- **始终执行：** 先更新 OpenAPI/状态表再改前端；所有页面使用真实 ID；写操作防重复；跨端字段同源；每个页面完成加载、空、错、无权限和成功态；每次合并前运行对应构建与状态机测试。
- **必须先确认：** TabBar 重排、支付渠道变化、订单/退款状态新增、开盒算法变化、数据库破坏性迁移、引入新的 UI/动画依赖、精确定位公开策略。
- **禁止执行：** 用 `localStorage`/小程序本地缓存作为订单或内容真相；前端随机决定真实开盒结果；在支付成功前展示结果；物理删除有引用的交易/内容记录；用一张静态图代替可验收的开盒动画；因接口暂缺而删除原型页面。

---

## 3. 前置条件与契约冻结

### 3.1 阶段四交接门槛

- [ ] 用户 JWT、禁用用户拦截和用户 ID 隔离可用。
- [ ] `trip` 有效性、用户归属和线路快照口径已冻结。
- [ ] `badge` / `user_badge` 查询可用，且与行为成就区分。
- [ ] `/me/stats` 和有效行程统计口径不再变更。
- [ ] 管理端 JWT、角色校验和现有 API 封装可用。
- [ ] 图片存储方案和公网 URL 方案已确定。

### 3.2 契约唯一来源

`docs/openapi.yaml` 继续作为唯一 API 契约来源，同时同步：

- `docs/接口设计.md`
- `docs/数据库设计.md`
- `docs/schema.sql`
- `docs/seed.sql`

沿用现有约定：

- 外部路径使用完整 `/api/v1/...`。
- API 字段使用 camelCase，数据库字段使用 snake_case。
- JSON 接口使用 `{ code, message, data }`，成功 `code=0`。
- 分页使用 `{ list, total, page, pageSize }`。
- 当前用户从 `JwtContext.getUserId()` 获取，禁止信任请求体中的 `userId`。
- 状态值使用英文机器值，中文只用于客户端展示。
- 时间沿用北京时间字符串格式。
- 写操作使用 `BusinessException`、事务和统一错误响应。

第 1–2 天完成 `v5-contract-freeze`，冻结以下内容后才能并行开发前后端：

1. 打卡与行程的关系。
2. 话题使用 ID 还是名称。
3. 点赞/收藏接口是 toggle 还是单向操作。
4. 评论唯一约束。
5. 公开 GET 的鉴权范围。
6. 帖子、打卡和禁用用户的可见性。
7. 海报在小程序生成还是服务端生成。
8. 成就统计和奖励幂等口径。
9. 达人榜口径、单向关注和禁用用户关注关系。
10. 帖子初始审核状态及 `review/published/featured/down/deleted` 状态迁移。
11. 订单、支付、开盒、退款和行程的机器状态、可执行动作、错误码与管理端显示文案。
12. 支付链接/二维码有效期、轮询间隔、后台切前台后的恢复规则和超时判定来源。
13. 开盒结果何时由服务端完成结算、结果接口的幂等键，以及动画与真实结算结果的同步方式。
14. 商品、线路、攻略使用实时数据还是订单/行程快照；历史订单和行程必须以快照展示。
15. 全部详情页的 URL 参数、分享路径、返回栈和登录后恢复参数。
16. 5.12/6.5 视觉 Token、字体资源、px→rpx 换算、组件档位和截图基线；任何新增颜色或字体必须先更新规范。

### 3.3 必须修正的 schema/契约问题

#### A. `checkin` 缺少 `trip_id`

当前 `checkin` 只有 `user_id`、`route_id` 和地点字段，但计划接口需要 `trip_id`。推荐新增：

```sql
ALTER TABLE checkin
  ADD COLUMN trip_id BIGINT UNSIGNED NOT NULL AFTER user_id,
  ADD UNIQUE KEY uk_user_trip (user_id, trip_id);
```

创建打卡必须同时校验：

- `trip.id = request.tripId`；
- `trip.user_id = 当前用户`；
- `trip.validity = 'valid'`；
- 行程线路与请求 `routeId`（如传入）一致；
- 同一行程是否允许重复打卡按冻结规则执行，推荐一期一条。

不能仅凭 `route_id` 判断用户可打卡。

#### B. `post_interaction` 唯一键阻止重复评论

当前唯一键：

```sql
UNIQUE KEY uk_post_user_collect (post_id, user_id, type)
```

该约束适合 `like`、`collect`，但会导致同一用户只能评论一次。推荐将评论改为独立表 `post_comment`；若为控制范围不拆表，则调整唯一约束，使其只约束 like/collect，并通过应用层保证评论内容合法。

在实施前必须选定方案并同步 schema、实体、API 和测试，不能保留当前约束直接开发评论功能。

#### C. 话题字段不一致

`community_post.topic` 为字符串，而 `topic` 表使用数字 ID。推荐新增 `topic_id`，并迁移已有 seed 帖子：

- 正式 API 使用 `topicId`；
- 服务端只允许选择状态为 `on` 的话题；
- 帖子列表按 `topicId` 筛选；
- `topic.post_count` 在发帖、下架、删除时按事务维护；
- 暂时保留旧 `topic` 字段时，必须说明兼容期和回填规则。

不得接受任意自由文本作为正式话题引用。

#### D. schema reset 不完整

`docs/schema.sql` 顶部 DROP 区域目前没有覆盖阶段二以后新增的表，包括：

```text
blind_box_prize
checkin
achievement
user_achievement
community_post
post_interaction
partner
coupon
user_coupon
topic
user_topic_follow
user_follow
checkin_like
user_point
point_log
```

本阶段必须补齐 DROP 顺序，验证空库初始化、重复初始化和 seed 重跑。seed 中清理但未填充的互动表要明确是空数据还是补充演示明细。

#### E. 原型已有达人关注，但 schema 只有话题关注

`user_topic_follow` 不能承载用户关注用户。为实现原型“关注”内容流和达人榜按钮，推荐新增：

```sql
CREATE TABLE user_follow (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  follower_user_id BIGINT UNSIGNED NOT NULL,
  followed_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_follower_followed (follower_user_id, followed_user_id),
  KEY idx_followed_user (followed_user_id)
);
```

约束：不能关注自己；关注禁用用户或不存在用户返回明确错误；重复关注/取消关注保持幂等；是否保留对禁用用户的既有关注记录按可见性规则冻结。该表只提供单向关注，不扩展为好友、私信或通知系统。

### 3.4 推荐冻结的公开接口

#### 社区

```text
GET    /api/v1/community/posts
GET    /api/v1/community/posts/{id}
POST   /api/v1/community/posts
POST   /api/v1/community/posts/{id}/like
POST   /api/v1/community/posts/{id}/collect
GET    /api/v1/community/posts/{id}/comments
POST   /api/v1/community/posts/{id}/comments
GET    /api/v1/community/topics
GET    /api/v1/community/leaders
GET    /api/v1/community/following/posts
POST   /api/v1/community/users/{id}/follow
DELETE /api/v1/community/users/{id}/follow
GET    /api/v1/me/collects
POST   /api/v1/upload/image
```

`GET /community/posts` 支持 `topicId`、`locationTag`、`page`、`pageSize`、`sort=recent|popular`。

发帖请求限制：

- 正文最多 500 字；
- 图片最多 9 张，服务端 URL 列表；
- 话题必须来自启用话题；
- 地点最多 100 字；
- 关联盲盒、打卡、行程必须做存在性和归属校验。

#### 打卡

```text
POST   /api/v1/checkins
GET    /api/v1/checkins
GET    /api/v1/checkins/{id}
POST   /api/v1/checkins/{id}/like
GET    /api/v1/checkins/rankings
GET    /api/v1/trips/{id}/checkin-info
```

`POST /checkins` 返回打卡详情及 `newlyUnlocked`；不让客户端提交成就进度或奖励 ID。

#### 成就

```text
GET    /api/v1/achievements
GET    /api/v1/achievements/{code}
GET    /api/v1/me/achievements
POST   /api/v1/me/achievements/check
```

支持：`checkin_count`、`trip_count`、`badge_count`、`post_count`、`expense_sum`。计分规则由服务端重新计算。

#### 管理端

```text
GET    /api/v1/admin/community/posts
PATCH  /api/v1/admin/community/posts/{id}/status
GET    /api/v1/admin/community/comments
PATCH  /api/v1/admin/community/comments/{id}/status
GET    /api/v1/admin/community/topics
POST   /api/v1/admin/community/topics
PUT    /api/v1/admin/community/topics/{id}
DELETE /api/v1/admin/community/topics/{id}
GET    /api/v1/admin/checkins
GET    /api/v1/admin/checkins/statistics
GET    /api/v1/admin/achievements
POST   /api/v1/admin/achievements
PUT    /api/v1/admin/achievements/{id}
DELETE /api/v1/admin/achievements/{id}
GET    /api/v1/admin/achievements/statistics
```

### 3.5 权限矩阵

| 动作 | 角色 |
|---|---|
| 工作台/目录/攻略只读 | `super_admin`、`operator`、`cs`、`finance`、`analyst` |
| 盲盒/线路/攻略/徽章/运营位写入 | `super_admin`、`operator` |
| AI/人格测试配置发布 | `super_admin`、`operator` |
| 社区/打卡/成就只读 | `super_admin`、`operator`、`cs`、`analyst` |
| 帖子下架/恢复 | `super_admin`、`operator`、`cs` |
| 话题写入 | `super_admin`、`operator` |
| 成就配置写入 | `super_admin`、`operator` |
| 订单/支付只读 | `super_admin`、`cs`、`finance`、`analyst` |
| 人工退款审核 | `super_admin`、`cs`、`finance`；金额阈值和终审角色按配置 |
| 用户启用/禁用 | `super_admin`、`cs`；运营只读 |
| 系统规则写入 | `super_admin`；运营可编辑草稿但不可发布高风险项 |
| 视觉规范只读 | 所有管理角色 |
| 统计导出 | `super_admin`、`finance`、`analyst` |

服务端强制校验，前端隐藏按钮不能替代权限控制。目录/攻略、AI/测试、帖子/评论、话题/成就、退款、用户状态和系统配置的写操作必须写入 `admin_audit_log`；日志至少记录角色、管理员、动作、目标、前后摘要、原因、IP、时间和请求 ID。

---

## 4. 后端详细开发计划

沿用现有 `controller / service / mapper / entity / dto / vo` 分层，参考：

- [OrderController.java](../server/src/main/java/com/tuge/controller/OrderController.java)
- [TripService.java](../server/src/main/java/com/tuge/domain/service/TripService.java)
- [ContentAdminService.java](../server/src/main/java/com/tuge/domain/service/ContentAdminService.java)
- [AdminAuthInterceptor.java](../server/src/main/java/com/tuge/common/auth/AdminAuthInterceptor.java)
- [WebMvcConfig.java](../server/src/main/java/com/tuge/common/config/WebMvcConfig.java)

### 4.1 推荐新增模块

```text
server/src/main/java/com/tuge/
├── controller/
│   ├── CommunityController.java
│   ├── CheckinController.java
│   ├── AchievementController.java
│   └── UploadController.java
├── controller/admin/
│   ├── CommunityAdminController.java
│   ├── CheckinAdminController.java
│   └── AchievementAdminController.java
├── domain/entity/
│   ├── Checkin.java
│   ├── Achievement.java
│   ├── UserAchievement.java
│   ├── CommunityPost.java
│   ├── PostInteraction.java
│   ├── Topic.java
│   ├── UserTopicFollow.java
│   ├── UserFollow.java
│   └── CheckinLike.java
├── domain/mapper/
│   └── 对应 BaseMapper 与聚合 SQL
└── domain/service/
    ├── CommunityService.java
    ├── PostInteractionService.java
    ├── TopicService.java
    ├── UserFollowService.java
    ├── CheckinService.java
    ├── AchievementService.java
    ├── AchievementProgressService.java
    ├── ImageUploadService.java
    ├── AdminCommunityService.java
    ├── AdminCheckinService.java
    ├── AdminAchievementService.java
    └── AdminAuditService.java
```

### 4.2 社区服务

#### 帖子列表和详情

- 公开列表只查询 `status IN ('published','featured')`。若数据库暂时沿用 `on/off/deleted`，必须在契约冻结时完成迁移或建立唯一映射，不能让两套状态同时进入业务代码。
- 过滤禁用用户内容的规则必须冻结并在 SQL 中执行。
- `recent` 按 `created_at DESC, id DESC`；`popular` 按热度公式和稳定的 ID 次序排序。
- 详情返回用户展示信息、图片列表、话题、地点、互动计数、当前登录用户的 `liked/collected` 状态和关联对象。
- 未登录读取可以没有个人互动状态，但不能查询或暴露其他用户隐私。

#### 发帖

事务内完成：

1. 校验正文长度和图片数量。
2. 校验话题处于启用状态。
3. 校验关联盲盒可公开展示。
4. 校验关联打卡/行程属于当前用户，或符合公开引用规则。
5. 插入帖子。
6. 更新话题帖子计数。
7. 写入审计/内容初始状态（如需审核，状态必须是明确的待审状态；不能误当成公开 `on`）。

#### 点赞、收藏、评论

- 点赞/收藏推荐采用 toggle 语义，返回 `liked/collected` 与最新计数。
- 互动记录和冗余计数在一个事务内处理。
- 重复点击必须幂等，不能计数漂移。
- 评论正文最多 500 字；回复必须校验父评论属于同一帖子。
- 评论可以多条，不能被点赞/收藏唯一键限制。
- 下架或删除帖子不能新增互动。

#### 达人与单向关注

- 达人榜按冻结后的发帖数、有效互动数和打卡数聚合，排序相同时使用稳定的用户 ID 次序。
- 关注/取消关注必须登录，采用幂等语义并返回 `followed` 和最新粉丝数。
- 关注流只查询已关注用户且当前公开的帖子，不暴露被关注用户的私有资料。
- 禁用用户、自关注和不存在用户按冻结错误码处理；不通过前端按钮状态代替服务端校验。

### 4.3 打卡服务

`CheckinService`：

- `checkin-info` 只接受本人行程；无效行程返回不可打卡。
- 创建打卡时以 `trip_id` 为主归属，校验线路和用户。
- 同一行程重复提交按冻结方案返回已有记录或 `409`，推荐返回已有打卡 ID，避免重复打卡。
- 位置描述、经纬度、照片 URL、备注经过字段长度和格式校验。
- GPS 若未启用，只保存可选字段，不声称完成位置验证。
- 创建成功后调用 `AchievementProgressService`，返回新解锁成就。
- 公开打卡详情只暴露冻结范围内的位置精度，不直接暴露用户敏感坐标。

### 4.4 成就服务

成就进度只由服务端从明细数据计算：

| 类型 | 推荐口径 |
|---|---|
| `checkin_count` | 有效用户打卡数；`checkin_5` 若文案要求“不同景点”，则按地点/线路去重 |
| `trip_count` | 有效行程数 |
| `badge_count` | `user_badge` 数量 |
| `post_count` | 用户正常且未删除帖子数 |
| `expense_sum` | 有效订单实付金额，单位分 |

必须在契约和验收记录中确定退款/失效行程是否影响已解锁成就。推荐：已解锁成就不回锁，当前进度按实时有效数据计算；奖励不重复发放。

成就检查事务：

1. 查询启用成就定义。
2. 从明细重新计算进度。
3. upsert `user_achievement`。
4. 首次达到阈值时写 `unlocked_at`。
5. 生成 `newlyUnlocked`。
6. 只在阶段六奖励能力接入后处理实际奖励；阶段五至少保证 `reward_sent` 幂等。

重复调用 `/me/achievements/check` 不得重复产生奖励或解锁事件。

### 4.5 图片上传

`UploadController` / `ImageUploadService` 必须：

- 仅允许登录用户上传；
- 校验 MIME、扩展名、大小和图片格式；
- 使用服务端生成文件名，防止任意路径写入；
- 返回服务端 URL，不接受临时路径直接入库；
- 限制单帖图片数量、单文件大小和总 URL 长度；
- 明确图片存储、访问和清理策略；
- 拒绝 `wxfile://`、本地临时路径和不受信任的外链。

### 4.6 管理端服务与审计

- 帖子列表支持关键词、话题、状态、时间和分页。
- 状态统一为 `review/published/featured/down/deleted`，状态变更必须记录原因和操作人；旧 `on/off` 数据在迁移层一次性转换。
- 话题支持创建、修改、排序、上下架和删除前引用检查。
- 打卡支持按线路、用户、日期查询，统计返回总数、今日/本周/本月、地点分布。
- 成就支持定义 CRUD、启停、阈值和奖励字段校验；删除前检查用户进度引用。
- 成就统计返回解锁人数和解锁率。
- 如果当前没有通用审计实现，新增 `AdminAuditLog`、`AdminAuditLogMapper`、`AdminAuditService`，至少记录管理员、动作、目标、前后摘要、IP 和时间。

### 4.7 MVC 鉴权配置

当前 [WebMvcConfig.java](../server/src/main/java/com/tuge/common/config/WebMvcConfig.java) 对普通 `/api/v1/**` 默认拦截。新增接口必须显式配置：

- 社区公开 GET（若允许匿名浏览）；
- 用户打卡、发帖、互动和我的成就必须登录；
- `/upload/image` 必须登录；
- 管理端全部走管理员拦截器。

禁止通过放宽全局拦截器实现“先让页面跑起来”。

---

## 5. 微信小程序详细开发计划

### 5.1 复用基础设施

复用：

- `miniapp/utils/request.js`：Token、401、统一错误。
- `miniapp/services/api.js`：用户端 API 集中出口。
- `miniapp/utils/storage.js`：筛选、草稿和分页缓存。
- `miniapp/utils/auth.js`：登录引导。
- `miniapp/utils/tuge-store.js`：既有用户、行程、徽章、弹层和导航。
- `miniapp/components/tuge-overlay/`：登录、Toast 和弹层风格。
- `miniapp/pages/trips/`：行程详情和打卡入口。
- `miniapp/pages/badges/`、`miniapp/pages/mine/`：徽章/成就入口和用户信息。
- `miniapp/app.wxss`：颜色、间距、圆角和全局布局。

建议不要把所有社区状态继续堆进 `tuge-store.js`，至少拆出：

```text
miniapp/utils/catalog-store.js
miniapp/utils/order-store.js
miniapp/utils/payment-store.js
miniapp/utils/unbox-store.js
miniapp/utils/community-store.js
miniapp/utils/checkin-store.js
miniapp/utils/achievement-store.js
```

`tuge-overlay` 只保留登录提示、短确认、Toast 和真正的一屏弹层；订单详情、退款、行程详情、帖子详情、发布等迁移到独立页面。拆分期间必须保持现有入口可用，禁止一次性删除旧弹层后再等待新页面补齐。

行为成就和已有线路徽章必须使用不同字段和 API：

- 线路徽章：`state.badges`、`applyRemoteBadges()`。
- 行为成就：`achievements`、`myAchievements`、`newlyUnlocked`。

### 5.2 API 封装

在 `miniapp/services/api.js` 新增：

```javascript
listBoxes
getBoxDetail
getRouteGuide
createOrder
listOrders
getOrderDetail
cancelOrder
createAlipayPayment
getPaymentStatus
listPaymentRecords
openOrder
getUnboxResult
applyRefund
getRefundDetail
listTrips
getTripDetail
listCommunityPosts
getCommunityPost
createCommunityPost
togglePostLike
togglePostCollect
listPostComments
createPostComment
listTopics
listCommunityLeaders
listFollowingPosts
followCommunityUser
unfollowCommunityUser
getCheckinInfo
createCheckin
listCheckins
getCheckin
toggleCheckinLike
listCheckinRankings
listAchievements
getAchievement
listMyAchievements
checkAchievements
uploadImage
```

已有 `getBoxes/getRoutes/createOrder/payOrder/getOrder/getMyOrders/cancelOrder/refundOrder/getMyTrips` 等能力优先复用并统一命名，不允许为了对齐计划重复实现第二套请求。列表和目录默认使用 `{ silent: true }`，支付、开盒、发布、点赞、评论、打卡和上传使用正常错误反馈。字段名以冻结后的 OpenAPI 为准。

### 5.3 社区页面

将占位的：

```text
miniapp/pages/community/index.js
miniapp/pages/community/index.wxml
miniapp/pages/community/index.wxss
```

改造成社区容器，新增：

```text
miniapp/components/community-tabs/
miniapp/components/post-card/
miniapp/components/post-grid/
miniapp/components/publish-button/
miniapp/components/topic-picker/
miniapp/components/image-uploader/
miniapp/components/like-button/
miniapp/components/comment-list/
miniapp/components/comment-input/

miniapp/pages/community/topics/
miniapp/pages/community/leaders/
miniapp/pages/community/publish/
miniapp/pages/community/post-detail/
```

社区顶部必须与当前原型保持四个视图，而不是旧计划中的三个：

- **发现**：默认内容流，支持推荐/古村/山野/露营/美食/文艺/开箱分类 Chip。
- **关注**：只展示已关注作者内容；无关注时提供去达人榜的行动按钮。
- **话题**：展示话题名称、说明和浏览/参与量，点击进入该话题内容流。
- **达人**：展示排行、头像/印章、昵称、简介、粉丝/开盒摘要和关注按钮。

#### 5.3.1 社区发现页

页面结构从上到下固定为：

1. 自定义状态栏/安全区。
2. 四视图切换栏和“我的收藏”图标按钮。
3. 横向分类 Chip。
4. 双列瀑布流。
5. 右下悬浮“发布”按钮。
6. 全局自定义 TabBar。

帖子卡片至少展示：

- 首图，按原图比例占位，避免加载后布局跳动；
- 多图数量或内容分类角标；
- 最多两行标题；
- 作者头像/首字占位和昵称；
- 点赞按钮、是否已点赞和最新点赞数。

列表接口需要返回稳定分页游标或 `page/pageSize`。刷新时清空旧游标，上拉时去重合并；卡片图片失败显示品牌占位图，不能塌陷为零高度。

#### 5.3.2 帖子详情页

详情页按原型拆成四个区域：

| 区域 | 字段/组件 | 交互 |
|---|---|---|
| 作者栏 | 头像、昵称、地点/签名、关注按钮、关闭/返回 | 关注乐观更新，失败回滚 |
| 内容区 | 横滑多图、标题、正文、话题标签、分类、地点、发布时间 | 图片支持预览；长文正常滚动 |
| 关联区 | 关联盲盒缩略图、名称、保底价、“去开盒” | 跳商品详情或开盒确认，不直接完成购买 |
| 互动区 | 评论总数、评论/回复列表、输入框、点赞、收藏、分享 | 登录拦截、重复提交防抖、失败保留输入 |

详情必须以服务端返回的 `liked`、`collected`、`followed` 为初始状态。点赞、收藏、关注和评论成功后同步刷新列表卡片计数；下架内容在详情打开期间被处理时，下一次操作返回明确提示并退出详情。

#### 5.3.3 发布页

发布页沿用原型底部抽屉/独立页面的视觉结构，但小程序实现建议使用独立页面，避免图片选择、键盘和底部安全区互相遮挡：

| 表单项 | 原型行为 | 正式校验 |
|---|---|---|
| 图片 | 九宫格添加，最多 9 张，可删除 | MIME/大小/数量由客户端预检和服务端复检 |
| 标题 | 最多 30 字 | 去首尾空格，标题与正文不能同时为空 |
| 正文 | 最多 500 字，实时计数 | 服务端再次校验长度和敏感内容策略 |
| 话题 | 原型默认 `#盲盒开箱` | 必须从启用话题中选择并提交 `topicId` |
| 地点 | 添加打卡地点 | 只展示模糊位置，精确坐标不默认公开 |
| 关联盲盒 | 显示“未关联”或已选盲盒 | 盲盒存在且允许公开展示 |
| 关联行程/打卡 | 从本人资产选择 | 服务端校验归属和有效状态 |

发布过程状态必须可见：草稿、图片待上传、上传中、部分失败、可重试、提交中、待审核、发布成功。退出未提交页面时提示保存草稿；发布成功清理草稿并回到发现流顶部。

#### 5.3.4 社区页面状态矩阵

| 场景 | 页面反馈 | 可执行动作 |
|---|---|---|
| 首次加载 | 卡片骨架或品牌加载态 | 不允许重复触发分页 |
| 空分类 | “这个分类下还没有笔记” | 切换分类或发布笔记 |
| 未关注任何达人 | “还没有关注的达人” | 进入达人榜 |
| 收藏为空 | 收藏夹空态 | 返回发现流 |
| 网络失败 | 保留已有数据并显示非阻塞错误 | 点击重试 |
| Token 失效 | 登录引导 | 登录后恢复原动作 |
| 内容下架 | 明确提示内容不可见 | 返回上一页并刷新列表 |
| 点赞/收藏失败 | 数字与按钮状态回滚 | Toast 提示，不整页刷新 |
| 发布审核中 | 显示“已提交，等待审核” | 查看我的发布或返回社区 |

原型参考文案和结构以 `docs/页面原型.html` 的 `tab-community`、`postDetail`、`postModal` 为准，禁止重新发明另一套社区视觉语言。

### 5.4 图片上传与发布

发布流程：

```text
填写正文 → 选择图片 → 上传 → 选择话题/地点 → 关联内容 → 提交帖子 → 成功反馈
```

- 正文实时字数限制 500。
- 图片选择使用 `wx.chooseMedia`，最多 9 张。
- 上传过程中逐张显示进度/失败重试/删除。
- 只有服务端返回的 URL 才能提交帖子。
- 发布成功后回到社区列表并刷新第一页。
- 发布失败保留草稿，避免用户输入丢失。

### 5.5 打卡页面

新增：

```text
miniapp/components/checkin-button/
miniapp/components/location-picker/
miniapp/components/photo-uploader/
miniapp/components/checkin-note/
miniapp/components/checkin-poster/

miniapp/pages/checkin/index/
miniapp/pages/checkin/success/
miniapp/pages/checkin/share/
miniapp/pages/checkin/list/
miniapp/pages/checkin/detail/
miniapp/pages/checkin/rankings/
```

在行程详情中加入“去打卡”入口，复用当前 `openTripDetail()` 和行程详情弹层。流程：

```text
本人有效行程 → 去打卡 → 位置描述/可选 GPS → 拍照 → 上传 → 备注
→ 创建打卡 → 成功页 → 海报展示 → 微信分享
```

海报方案必须与契约一致。推荐小程序端使用 Canvas/页面截图生成海报，服务端保存已上传的 `sharePosterUrl`；若采用服务端生成，则必须补充专用 API，不能把未实现的生成接口列为验收项。

### 5.6 成就页面

新增：

```text
miniapp/components/achievement-badge/
miniapp/components/achievement-card/
miniapp/components/achievement-unlock-modal/
miniapp/pages/achievements/index/
miniapp/pages/achievements/detail/
```

- 从“我的”或已有图鉴入口进入，不默认改变当前 5 项 TabBar。
- 展示名称、描述、等级、当前进度、阈值、解锁时间和奖励说明。
- 打卡成功收到 `newlyUnlocked` 后显示解锁弹窗。
- 结果以服务端成就状态为准，前端不自行计算最终解锁。
- 线路徽章和行为成就使用不同标题、图标和文案，避免概念混用。

### 5.7 TabBar 决策

当前存在两套可见导航方案：

| 来源 | 五项导航 | 说明 |
|---|---|---|
| 当前小程序 | 首页 / AI 搭子 / 社区 / 行程 / 我的 | 已落到 `app.json` 和自定义 TabBar |
| 最新用户端 HTML 原型 | 首页 / 商品 / 社区 / AI 搭子 / 我的 | 商品成为一级入口，行程和图鉴转为二级页 |

Phase 5 默认采用“当前小程序方案”，原因是本阶段核心是社交增强，不同时重排阶段三、四已经稳定的交易和资产入口。页面原型中的商品广场仍需实现/保留，但从首页“查看更多”、商品卡和社区“抽同款”进入；图鉴、成就和打卡从首页、行程详情或“我的”进入。

第 2 天必须由产品确认并在联调记录中写明最终选择。确认后同步更新页面原型中的导航标注或小程序配置，不能长期保留两套相互矛盾的验收口径。

若产品最终要求将图鉴加入 TabBar，必须同步修改：

- `miniapp/app.json`
- `miniapp/custom-tab-bar/index.js`
- `miniapp/custom-tab-bar/index.wxml`
- `miniapp/utils/tuge-store.js`
- 页面顺序、返回行为和原型对照记录。

### 5.8 非社区用户页面逐页补齐

#### 首页、商品广场与商品详情

- 首页继续以 `pages/index/index` 为容器，所有商品卡、今日特选、横幅和 AI 推荐必须传递真实 `boxId`；“查看更多”进入商品广场，“查看详情”进入商品详情，“立即开启”进入同一套开盒确认流程。
- 商品广场按原型提供 `all/nearby/province/cross/theme` 分类；筛选只影响列表，不改变购物车；刷新后保持当前分类，返回时恢复滚动位置。
- 商品卡必须展示封面、排行/热度标记、名称、短描述、价格、保底金额、加购和立即开盒；下架商品保留在历史购物车时显示“已下架”且禁止结算。
- 商品详情以 `boxId` 请求，展示商品快照字段、适用心情、服务包含、保底/退换规则和对应主题攻略入口；首屏底部固定“加入购物车 / 立即开盒”，不得遮挡正文和安全区。
- 加购使用本地轻量购物车时只缓存 `boxId + quantity`，进入购物车后必须重新请求商品价格和状态；价格、库存/可售状态不得信任本地缓存。

#### 攻略、行程详情与 AI 日记

- `pages/guide/detail?routeId=...` 展示当前线路模板；`pages/guide/detail?tripId=...` 展示开盒时固化的行程攻略快照。历史行程不能因后台修改线路模板而悄悄变化。
- 完整攻略固定包含：线路概览、分时日程、景点看点/游览提醒、交通、餐饮、住宿、费用说明、行前清单、天气 Plan B、安全提示和 FAQ。缺失区块显示“暂未完善”，并让管理端工作台生成待办。
- 行程列表区分有效、退款/失效和加载失败；退款行程保留只读记录并明确不可打卡，不从历史中直接消失。
- 行程详情以 `tripId` 打开，展示订单/线路快照、价格和票面、攻略、打卡状态及 AI 日记。无效行程禁止新打卡，已有帖子/打卡按可见性规则保留。
- AI 日记提交 `tripId`，生成中禁重复提交；成功内容标注“AI 生成”，失败保留当前页面并允许重试，不能用本地固定文案冒充接口结果。

#### 购物车、订单、支付记录与退款

- 购物车提供空态、失效商品、删除、数量和结算确认。若业务仍规定一个订单只对应一个盲盒，批量结算必须明确拆为多个订单并逐个支付/开盒，不能把多个商品错误写进单盒订单。
- 订单列表按“全部 / 待支付 / 已开盒 / 退款”筛选；卡片动作完全由服务端状态返回的 `allowedActions` 决定，禁止只靠前端枚举猜测。
- 订单详情展示商品快照、订单号、下单/过期时间、实付、渠道、支付流水、开盒结果、行程和退款；后台切回、下拉刷新或从收银台返回时必须重新查询订单。
- 支付记录与订单分开：一笔订单可有多次支付发起记录，但只允许一个最终成功结果；每条记录展示 `paymentNo/orderNo/channel/amount/status/createdAt/paidAt`。
- 退款申请先请求可退校验，再提交原因和类型；审核中禁止重复申请。详情展示申请时间、退款金额、处理状态、驳回原因、到账渠道/时间和自动退款原因。

#### 图鉴、人格测试、AI 搭子与我的

- 图鉴继续展示线路徽章，行为成就进入独立入口；二者不得共用“已解锁数量”或详情字段。
- 人格测试严格按原型 5 题、4 类结果实现；每题只能计一次，完成后保存服务端结果并刷新首页/商品推荐，重测需明确覆盖规则。
- AI 搭子保留对话历史侧栏、快捷问题、消息输入和推荐卡；推荐卡必须能进入对应商品/攻略详情，模型失败时展示配置的降级话术而不是空白。
- “我的”菜单必须至少提供资料、订单、行程、图鉴、支付记录、购物车、收藏、打卡、成就、服务/保底规则和退出。未登录可看规则，受保护入口统一走登录后恢复。

### 5.9 支付、开盒、结果与退款完整状态机

#### 用户界面状态

```text
idle
  └─ 点击立即开盒 → confirm
confirm
  ├─ 关闭 → idle
  └─ 确认下单 → creating_order → pending_pay
pending_pay
  ├─ 支付成功 → paid → opening_request → drawing → result
  ├─ 稍后再付 → 订单列表（仍为 pending_pay）
  ├─ 主动取消 → cancelled
  ├─ 倒计时结束/服务端过期 → cancelled
  └─ 支付发起/查询失败 → pending_pay + 可重试
opening_request
  ├─ 已有结果 → drawing（只播放展示动画，不再次抽取）
  ├─ 首次结算成功 → drawing → result
  └─ 无可用线路/结算失败并完成自动退 → refunded
result
  └─ 收下路线 → trip_detail
opened
  ├─ 符合条件申请退款 → refund_pending → refunded / refund_rejected
  └─ 查看行程/攻略/打卡
```

#### 服务端与页面状态对应

| 领域 | 机器状态 | 用户端显示 | 允许动作 | 管理端显示/动作 |
|---|---|---|---|---|
| 订单 | `pending_pay` | 待支付 + 剩余时间 | 去支付、稍后支付、取消 | 待支付，只读；到期后由服务端关闭 |
| 订单 | `paid` | 支付成功，准备开盒 | 查询/发起幂等开盒 | 已支付；可查看支付流水，不可手改结果 |
| 订单 | `opened` | 已开盒 | 看结果、行程、攻略、可退校验 | 已开盒，联查路线和行程 |
| 订单 | `cancelled` | 已取消/已超时 | 重新购买同商品 | 已取消，只读 |
| 订单 | `refunded` | 已退款 | 看退款详情 | 已退款，联查退款单与失效行程 |
| 支付 | `created/pending` | 等待支付宝支付 | 打开/复制链接、轮询、刷新 | 待支付流水，只读 |
| 支付 | `success` | 支付成功 | 进入开盒 | 成功流水，计入成交需再排除退款 |
| 支付 | `failed/closed` | 支付失败/已关闭 | 在订单未过期时重新发起 | 失败原因和渠道回执只读 |
| 退款 | `pending_review` | 退款审核中 | 看进度 | 客服/财务按权限通过或驳回 |
| 退款 | `approved` | 已通过/原路退回中 | 看到账状态 | 记录处理人、理由、渠道退款号 |
| 退款 | `rejected` | 已驳回 | 查看驳回原因；按规则再次申请 | 只读或重新审核按契约 |
| 退款 | `auto` | 已自动退款 | 看自动退原因 | 不可人工重复通过 |

状态名称最终以冻结后的 OpenAPI 为准；前端展示文案可本地映射，但不得把 `paid` 直接当作 `opened`，也不得把“支付链接已生成”当作“支付成功”。

#### 支付实现要求

- 创建订单与发起支付分别使用幂等键；连续点击不得创建多笔订单或多笔同时有效的支付。
- 倒计时的真相来自服务端 `expireAt`，前端每秒只负责显示；页面重进后按服务端时间重新计算，不能重置为 15:00。
- 支付页展示支付宝沙箱链接/二维码；小程序能力受限时提供复制链接和“在外部浏览器打开”的明确指导，并在返回小程序后立即查询。
- 前台轮询建议约 1800ms，一旦成功、失败、关闭、取消、退款或页面离开立即停止；切后台暂停，回前台先主动查询一次再决定是否恢复轮询。
- 网络失败不改变订单状态；保留订单号和剩余时间，提供重试。服务端返回超时/取消时立即停止倒计时和支付动作。
- 开发/Mock 支付必须有明显环境标记，只在非生产环境启用；生产包不得出现“模拟已付款”按钮。

#### 开盒结算与恢复要求

- 开盒结果只能由服务端产生，接口以 `orderNo` 幂等；同一订单重复请求必须返回同一 `routeId/tripId/result`，不能重新随机。
- 支付成功后先确认服务端已有可展示结果，再播放动画；网络较慢时保持“正在准备路线”状态，不允许动画播完后显示空结果。
- 动画阶段禁止关闭和重复触发，但应用被系统中断后可在订单详情恢复：`paid` 继续结算，`opened` 直接取既有结果并可选择是否补播一次动画。
- 没有满足分类、上下架和保底条件的路线时，服务端在同一事务/补偿流程中标记自动退款；用户端展示明确原因，管理端退款页产生只读自动退记录。
- 行程、徽章和成就只在开盒结果成功落库后生成/更新；动画完成不是业务提交点，动画失败也不能撤销已经成功的开盒。

### 5.10 小程序开盒动画还原规范

当前 `tuge-overlay` 的 `draw-wrap` 脉冲图标和 500ms 定时切换必须替换为与 HTML 原型同构的 `unbox-animation` 组件。组件至少包含盒体、盒盖、路线卡、六条光线、六枚彩纸、阴影、状态文案和进度条，不能用单张 GIF 或静态图代替。

| 时间轴 | 动画对象 | 原型参数 | 小程序验收结果 |
|---:|---|---|---|
| 0–2700ms | 整体揭晓阶段 | 总时长约 2700ms | 期间隐藏关闭按钮、屏蔽重复点击 |
| 120–820ms | 盒体摇动 | `.7s ease .12s` | 左右轻摇，无布局位移 |
| 650–1650ms | 盒盖打开 | `1s cubic-bezier(.2,.8,.2,1) .65s` | 上移并向左旋开 |
| 820/900–2270/2350ms | 彩纸 | `1.45s ease-out`，奇偶延迟 `.82s/.9s` | 左右分散、旋转、淡出 |
| 1000–1900ms | 光线 | `.9s ease 1s` | 六方向短暂闪现后淡出 |
| 1020–2270ms | 路线卡揭晓 | `1.25s cubic-bezier(.16,1,.3,1) 1.02s` | 从盒内上升，最终稳定居中 |
| 0–2650ms | 进度条 | `2.65s linear` | 从 0 到 100%，不反向、不重置 |
| 1950–2400ms | 盒体回稳 | `.45s ease 1.95s` | 轻微上浮后归位 |
| 2700–3200ms | 结果入场 | `.5s cubic-bezier(.16,1,.3,1)` | 结果卡淡入、上移、缩放到 1 |

状态文案每 620ms 轮换一次，并使用约 150ms 淡出/淡入：

1. 正在验证价值保底
2. 正在摇匀候选目的地
3. 正在匹配你的主题线路
4. 路线卡即将揭晓

实现与可访问性约束：

- 使用 WXSS `@keyframes` 和稳定尺寸容器，元素动画不得推动弹层高度或导致按钮跳动。
- 动画开始、结束和页面卸载时统一清理 timer；重复进入需先重置 class/组件状态再触发。
- 低性能设备掉帧不影响 2700ms 后的业务结果；动画结束事件和兜底 timer 二者取先到且只执行一次。
- 为“减少动态效果”或低性能降级提供近乎即时的静态揭晓，但仍保留状态确认和结果入场；不得跳过服务端结算。
- 动画组件只接收已结算的展示 DTO，不访问随机池、不写订单、不生成行程。
- 截图不足以验收时序，必须提供普通速度录屏、慢速录屏和前后台切换恢复录屏。

### 5.11 HTML 原型到小程序文件与导航映射

建议在 `miniapp/app.json` 注册下列页面；具体分包可在不改变路径语义的前提下调整：

```text
pages/index/index                     ← tab-home
pages/market/index                    ← tab-market
pages/product/detail                  ← tab-product
pages/guide/detail                    ← tab-guide
pages/cart/index                      ← tab-cart
pages/ai/index                        ← tab-ai
pages/badges/index                    ← tab-badges
pages/trips/index                     ← tab-trips
pages/trips/detail                    ← tripDetailModal
pages/mine/index                      ← tab-mine
pages/orders/index                    ← orderModal
pages/orders/detail                   ← 订单卡详情
pages/payment-records/index           ← tab-records
pages/payment/cashier                 ← stepPay（若采用独立页）
pages/refunds/apply                   ← refundModal
pages/refunds/detail                  ← 退款进度
pages/community/index                 ← tab-community
pages/community/post-detail           ← postDetail
pages/community/publish               ← postModal
pages/community/topics                ← 话题视图
pages/community/leaders               ← 达人视图
pages/community/collections           ← 我的收藏
pages/checkin/**                      ← 打卡全流程
pages/achievements/**                 ← 行为成就
```

关键导航必须遵守下表：

| 来源 | 动作 | 目标 | 必传参数/返回行为 |
|---|---|---|---|
| 首页今日特选/商品卡 | 查看详情 | 商品详情 | `boxId`；返回恢复首页筛选/滚动 |
| 首页“查看更多” | 浏览更多 | 商品广场 | 可带 `category/mood` |
| 商品广场/详情/购物车 | 立即开盒 | 开盒确认 | `boxId`；未登录后恢复同一动作 |
| 商品详情 | 查看攻略 | 攻略详情 | `routeId` 或主题攻略 ID |
| 支付页 | 稍后再付 | 订单详情/列表 | `orderNo`，保持 `pending_pay` |
| 支付成功 | 开盒 | 动画/结果 | `orderNo`；禁止客户端传 `routeId` 决定结果 |
| 开盒结果 | 收下路线 | 行程详情 | 服务端返回的 `tripId` |
| 行程详情 | 完整攻略/打卡 | 攻略详情/打卡页 | `tripId`，确保读取快照与归属 |
| AI 推荐卡 | 商品/攻略 | 对应详情 | `boxId` 或 `routeId` |
| 帖子关联盲盒 | 抽同款 | 商品详情 | `boxId`，先看详情再开盒 |
| 帖子地点/行程 | 查看关联 | 打卡/行程只读详情 | 有权限时传 `checkinId/tripId` |
| 我的订单/支付记录 | 查看详情 | 订单详情 | `orderNo`；支付记录另带 `paymentNo` |
| 管理端/客服分享路径 | 用户端定位 | 对应公开详情 | 仅公开资源；受保护资源登录并校验归属 |

自定义 TabBar 只负责一级导航，二级详情使用 `navigateTo`，同一 Tab 重选使用 `switchTab` 并按产品规则决定是否回顶。分享链接、扫码链接和登录恢复都必须使用同一套路由参数解析器，未知/失效 ID 展示明确错误页而不是静默回首页。

### 5.12 用户端 UI 视觉系统与配色规范

用户端以原型 390×844 画布为基准，空间尺寸按 `750 / 390 = 1.923` 转为 rpx；字体不得使用随视口宽度连续缩放的 `vw` 方案。375×812 只做边界适配，不重新设计比例。所有页面先使用以下 Token，再写组件样式，禁止在页面 WXSS 中随意新增近似色。

#### 颜色 Token

| Token | 色值 | 用户端职责 | 禁止用法 |
|---|---|---|---|
| `--cream` | `#F6F1E6` | 全局页面底色、弹层底色 | 不作为主按钮文字色 |
| `--cream-2` | `#EFE6D6` | 次级背景、禁用/等待底、图片占位 | 不代替错误态 |
| `--sage` | `#8EA47C` | 主按钮、选中 Chip、进度、主强调 | 不大面积铺满整个页面 |
| `--sage-deep` | `#6C7E58` | 激活图标、价格/重点文字、链接 | 不用于大段正文 |
| `--sage-mist` | `#E4EDD8` | 云朵头、软面板、成功/关联信息背景 | 不作为白色正文上的深色遮罩 |
| `--sage-soft` | `#C9D6B8` | 时间线、柔和边线、未完成进度 | 不代替主文字 |
| `--ink` | `#3C342C` | 标题、正文、描边、深色按钮 | 不使用纯黑 `#000` 替代 |
| `--muted` | `#8F8376` | 描述、时间、辅助信息 | 关键金额和错误原因不得使用弱文本色 |
| `--paper` | `#FFFDF8` | 卡片、输入框、底栏、票券 | 不使用纯白大面积替换 |
| `--line` | `#E7DCCE` | 分割线、输入框边框、手柄 | 不使用默认灰边框 |
| `--blush` | `#E8B4A2` | 彩纸、轻提示、品牌点缀 | 不作为通用主色 |
| `--caramel` | `#D4924A` | 等待状态、手写问候点缀 | 不表示成功 |
| `--danger-bg/text` | `#F3DDD4 / #A15B48` | 错误、驳回、失效和危险操作 | 不使用高饱和纯红铺底 |
| `--like` | `#D4705F` | 已点赞心形 | 仅用于互动已选状态 |
| `--alipay` | `#1677FF` | 支付宝品牌图标/渠道标识 | 不扩散为产品主色 |

云朵头使用原型的 `#E3EDD6 → #E8F0DC` 纵向过渡并叠加浅色云团；首页会员横幅使用 `#B4C6A2 → #D2E0C3 → #E7F0DB`。除原型明确存在的云朵、横幅、图片遮罩和攻略 Hero 外，不新增装饰渐变。

#### 字体与字号

| 层级 | 字体 | 390px 原型尺寸 | 小程序目标 | 使用场景 |
|---|---|---:|---:|---|
| 手写问候 | Caveat Bold | 24–34px | 46–65rpx，页面固定值 | `Good Journey`、品牌问候，不能用于业务数据 |
| 品牌/大标题 | Noto Serif SC 900 | 20–28px | 38–54rpx | 店名、商品名、攻略 Hero、结果标题 |
| 页面标题 | Noto Serif SC 900 | 18–23px | 35–44rpx | 二级页标题、弹层标题 |
| 卡片标题 | Noto Sans SC 700/800 | 12–15px | 23–29rpx | 商品、帖子、订单、行程 |
| 正文 | Noto Sans SC 400/600 | 11–13px | 21–25rpx | 正文、表单、说明 |
| 辅助信息 | Noto Sans SC 500/700 | 9–11px | 17–21rpx | 时间、标签、英文副标题 |

- `miniapp/assets/fonts/Caveat-Bold.ttf` 继续用于英文手写字；中文标题必须补充可合法分发的 Noto Serif SC 子集字体，正文补充 Noto Sans SC 子集或使用能通过截图对照的系统回退。
- 字体加载失败时回退顺序固定：标题 `Noto Serif SC, Songti SC, STSong, serif`；正文 `Noto Sans SC, PingFang SC, sans-serif`。
- 字间距只用于原型中的英文 Kicker/导航分组；正文和按钮文字 `letter-spacing: 0`，不得通过负字距挤压文本。

#### 尺寸、间距、圆角和阴影

| 元素 | 原型尺寸 | 小程序目标 |
|---|---:|---:|
| 页面水平边距 | 18px，社区为 12px | 34.62rpx，社区为 23.08rpx |
| 状态栏占位 | 54px | 103.85rpx，并叠加真实安全区计算 |
| 最小点击高度 | 44px | 84.62rpx |
| 主按钮 | 44px 高、胶囊圆角 | 84.62rpx、`999rpx` |
| 输入框 | 38–44px 高 | 73.08–84.62rpx |
| 普通卡片圆角 | 14/16/18px | 26.92/30.77/34.62rpx，按原型组件选用 |
| 图片/功能块圆角 | 10/12/14px | 19.23/23.08/26.92rpx |
| 底部 TabBar | 72px + 安全区 | 138.46rpx + `safe-area-inset-bottom` |
| Bottom Sheet | 顶部 28px 圆角、最大高 86% | 53.85rpx、最大高 86% |
| Sheet 拖拽柄 | 42×4px | 80.77×7.69rpx |
| 浮动发布按钮 | 44px 高，距右 18px/底栏上 16px | 84.62rpx，右 34.62rpx |

阴影只使用原型的三档：卡片 `0 4px 14px rgba(60,52,44,.05)`、轻控件 `0 3px 12px rgba(60,52,44,.05)`、强调浮层 `0 6px 18px rgba(108,126,88,.36)`；不得增加蓝紫发光、重黑投影或装饰色光晕。页面纸张纹理透明度保持约 `.035`，纹理层必须 `pointer-events: none`。

#### 共用组件样式

| 组件 | 默认态 | 选中/成功态 | 禁用/错误态 |
|---|---|---|---|
| 主按钮 | `--sage` 底、白字、44px 高 | 按压为 `--sage-deep`，提交中保留尺寸 | 禁用降透明度并阻止点击；错误在按钮外说明 |
| 次按钮 | `--paper` 底、`--ink` 1.4px 边 | 按压仅轻微背景变化 | 不改成主绿色 |
| Chip | `--cream-2/--paper` 底、`--muted` 字 | `--sage` 底、白字 | 失效使用 `--line` 边和弱文本 |
| 输入框 | `--cream/--paper` 底、`--line` 边 | 聚焦边为 `--sage` | 错误边/说明为 `--danger-text` |
| 信息卡 | `--paper` 底、14–18px 圆角、轻阴影 | 关联/成功可用 `--sage-mist` | 失效降低内容对比但保留可读性 |
| 状态标签 | 默认 `--sage-mist/--sage-deep` | 成功 `--sage/white` | 等待 `--cream-2/--caramel`；失败 `--danger-bg/text` |
| Toast | 纸白底、墨色 1.4px 边、异形圆角 | 成功只改图标/短文案 | 错误不得整屏红色覆盖 |
| 骨架 | 固定与内容相同宽高 | 数据到达后淡入，不改变布局 | 加载失败切错误块，不无限闪烁 |

UI 代码禁止复制原型中的大量内联 `style`。全局 Token 和通用组件放在 `app.wxss`，页面只保留布局类，动态进度等确需变化的值才使用内联样式：

```css
.market-card { background: var(--paper); border-radius: 34.62rpx; }
.market-card__title { color: var(--ink); font-weight: 800; }
.market-card--disabled { opacity: .58; }
```

命名使用页面/组件前缀与状态后缀，避免 `.row/.card/.title` 等跨页面污染；WXML 不使用 emoji 代替图标，优先复用 `miniapp/assets/icons`、`assets/mascot` 和 Tab 图标。

### 5.13 用户端逐页面 UI 修改矩阵

| 页面/组件 | 必须修改的布局与样式 | 配色和图片 | 关键视觉验收 |
|---|---|---|---|
| 首页 | 复核 54px 安全头、云朵 Header、杂志式今日特选、搜索/图鉴并排、4 分类、人气双列卡 | 奶油底、鼠尾草云头、纸白卡；使用真实 6 张盲盒封面和品牌吉祥物 | 390px 下无横向滚动；标题、吉祥物、气泡不重叠；底栏不遮人气卡 |
| 商品广场 | 新增标准子页头、横滑分类 Chip、双列商品卡、购物车浮标 | 商品图 116px 高 `cover`；加购为雾绿、开盒为主绿 | 最长商品名两行内；价格/保底清晰；下架卡不允许开盒 |
| 商品详情 | 292px Hero、圆形返回/购物车、23px 衬线标题、28px 价格、服务四宫格、粘底双按钮 | Hero 使用商品真实封面；保底用深鼠尾草，规则用弱文本 | 粘底操作含安全区且不遮正文；图片不暗到无法看清商品 |
| 完整攻略 | 250px 实景 Hero、5 项锚点、天气条、双列事实、时间线、景点/交通/餐住/费用/清单/FAQ | Hero 允许原型暗色遮罩；其余保持奶油/纸白/雾绿 | 长攻略滚动顺畅；锚点吸顶；清单勾选不引发布局跳动 |
| 购物车 | 子页头、商品行、失效态、金额汇总、粘底结算 | 纸白商品行、分割线、主绿结算 | 空态居中；失效原因可读；底部金额和按钮不挤压 |
| 登录/资料 | 保留品牌头和纸张输入语言；手机号、验证码、微信按钮纵向排列 | 输入为奶油底，主按钮鼠尾草；微信/支付宝只保留品牌色在图标 | 键盘弹起不遮验证码/提交；错误文案固定占位不跳动 |
| 订单/支付记录 | 订单筛选 Chip、14px 纸卡、状态右上、双操作区；记录卡显示批次/渠道/金额 | 待支付焦糖、已开盒深绿、退款危险柔色 | 不同状态卡高度稳定；长订单号可复制且不溢出 |
| 支付收银台 | 订单软面板、倒计时、支付宝渠道卡、二维码/链接区、三层动作 | 产品色保持鼠尾草；支付宝蓝仅渠道块 | `15:00` 数字固定宽度；轮询文案和按钮切换不抖动 |
| 开盒/结果 | 按 5.10 的 220px 场景与动画；结果图 140px、标题、目的地/票面软面板 | 盒体主绿、纸白路线卡、腮红/金/绿彩纸 | 动画期间关闭按钮不可见；结果卡在同一 Sheet 内无高度突变 |
| 行程列表/详情 | 票券式纸卡、虚线分割、三节点预览、路线/攻略双按钮；详情分时路线与景点 | 有效行程正常色，退款仅降低权重并有危险标签 | 行程状态不能仅靠颜色；长目的地和价格不重叠 |
| AI 搭子 | 云朵头、吉祥物、历史侧栏、消息流、快捷 Chip、底部输入 Dock | 用户/AI 气泡使用纸白和雾绿区分，推荐卡用真实封面 | 键盘与输入 Dock 不重叠；历史展开不压缩消息到不可读 |
| 图鉴/人格测试 | 子页云头、人格横幅、进度卡、3/4 列徽章；测试 Sheet 含题号/进度/结果印章 | 锁定雾绿虚线、解锁深绿实线；结果使用纸白/鼠尾草 | 12 枚徽章尺寸稳定；题目长文本不遮选项 |
| 社区发现 | 50px 安全头、四 Tab、收藏圆钮、横滑 Chip、2 列瀑布流、悬浮发布 | 奶油底、纸白帖子卡、激活下划线深绿、点赞珊瑚色 | 图片按原比例占位；卡片加载后不跳列；浮钮在 TabBar 上方 |
| 帖子详情 | 全屏右滑入独立页效果、作者栏、多图、正文、关联盲盒卡、固定互动栏 | 正文奶油底；同款卡纸白；关注主绿；点赞/收藏按状态色 | 长文/评论能滚动；键盘弹起后输入栏可见；底栏不遮最后评论 |
| 发布页 | 九宫格、标题输入、正文计数、话题/地点/关联行、固定发布按钮 | 图片槽纸白虚线边；上传中雾绿；失败危险柔色 | 9 图布局不变形；500 字计数不遮正文；草稿提示清晰 |
| 打卡/成就 | 照片上传、位置、备注、海报预览；成就卡和解锁 Sheet | 打卡沿用攻略时间线/纸卡；成就锁定与图鉴视觉区分 | 精确位置不公开；海报比例稳定；解锁动画不与开盒动画混用 |
| 我的 | 云朵个人头、头像、等级 Pill、4 项统计、分组菜单、规则块 | 统计/菜单纸白，等级和关键数深绿 | 所有入口完整；未登录/登录态高度稳定；长昵称省略而非挤压 |

### 5.14 小程序前端文件级修改清单

| 文件/目录 | 当前问题 | Phase 5 修改内容 |
|---|---|---|
| `miniapp/app.json` | 只注册 7 个主页面 | 注册 5.11 全部页面；按目录/交易/社区分包；配置分享和自定义导航 |
| `miniapp/app.wxss` | 已有核心 Token，但通用类与页面样式混杂 | 保留准确 Token；补字体、按钮/Chip/卡片/状态/骨架/空错态；移出只属于单页的规则 |
| `miniapp/app.js` | 全局初始化和业务恢复边界不清 | 只处理登录恢复、前后台事件和全局异常；支付/开盒恢复委托领域 Store |
| `miniapp/custom-tab-bar/*` | 当前顺序与 HTML 原型不一致待决策 | 按 5.7 决策同步图标、顺序、选中颜色、72px 高度和安全区；二级页隐藏 |
| `miniapp/behaviors/tuge-page.js` | 页面状态与 overlay 绑定较深 | 提供安全区、登录恢复、统一 loading/error/refresh 和 TabBar 显隐，不承载交易数据 |
| `miniapp/components/tuge-overlay/*` | 承载过多长详情，抽取态为简化动画 | 迁走订单/行程/退款等长页；保留短确认、Toast；接入新的支付/开盒组件 |
| `miniapp/services/api.js` | 交易接口已有，社区等缺失 | 按 5.2 统一命名、参数和响应；禁止页面直接拼 URL |
| `miniapp/utils/tuge-store.js` | 首页、交易、弹层和资产状态集中 | 按 5.1 拆分目录/订单/支付/开盒/社区/打卡/成就 Store，并保留兼容迁移层 |
| `miniapp/utils/constants.js` | 状态/展示映射可能散落 | 集中机器状态、UI 文案、颜色语义、页面路径和超时常量；不得保存动态业务结果 |
| `miniapp/pages/index/*` | 已实现基础首页，需要逐像素回归 | 对齐云头、特选、筛选、横幅、商品卡、入口和所有状态；入口改为真实页面导航 |
| `miniapp/pages/ai/*` | 已实现基础会话 | 对齐历史侧栏、消息气泡、推荐卡、输入 Dock、键盘和失败降级 |
| `miniapp/pages/badges/*` | 已有图鉴 | 对齐 12 徽章、进度、人格测试入口，并增加行为成就独立入口 |
| `miniapp/pages/trips/*` | 列表已有，详情在 overlay | 列表对齐票券卡；新增 `detail` 四文件并迁移攻略/日记/打卡入口 |
| `miniapp/pages/mine/*` | 已有资料/统计入口 | 补订单、行程、图鉴、支付、购物车、收藏、打卡、成就、规则与退出分组 |
| `miniapp/pages/login/*` | 页面过简 | 补手机号/验证码、微信、协议、错误占位、登录后恢复和完整品牌样式 |
| `miniapp/pages/community/*` | 首页仍是 1 行占位 | 实现发现/关注/话题/达人、详情、发布、收藏以及对应 WXSS/页面状态 |
| `miniapp/pages/market/`、`product/`、`guide/`、`cart/` | 不存在 | 每页新增 `.js/.json/.wxml/.wxss`，严格按 5.13 对齐 |
| `miniapp/pages/orders/`、`payment-records/`、`payment/` | 不存在独立页 | 新增列表/详情/收银台/记录页；完成倒计时、轮询和重入恢复 |
| `miniapp/pages/refunds/` | 仅 overlay | 新增申请和详情页，覆盖审核中/通过/驳回/自动退 |
| `miniapp/pages/checkin/`、`achievements/` | 不存在 | 按 5.5/5.6 创建页面、海报/解锁组件和完整状态 |
| `miniapp/assets/` | 已有盲盒、图标、吉祥物和 Caveat | 建立资产清单；补合法中文字体/占位图；禁止重复下载同图和使用失效远程图 |

任何页面目录的四个文件视为同一实现单元：`.json` 声明组件和分享能力，`.js` 只处理页面编排，`.wxml` 保持语义结构，`.wxss` 只含页面局部布局。业务状态、请求和复杂动画必须下沉到对应 Store/组件。

---

## 6. 管理端详细开发计划

### 6.1 复用模式

复用：

- `admin-web/src/api/index.ts`：请求、401、统一响应和 Toast。
- `admin-web/src/composables/useTable.ts`：分页、筛选和刷新。
- `admin-web/src/components/kitchen/PageHead.vue`。
- `admin-web/src/components/kitchen/KitchenDrawer.vue`。
- `admin-web/src/components/kitchen/DrawerHost.vue`。
- `admin-web/src/assets/styles/kitchen.css`。
- `admin-web/src/views/orders/index.vue`：详情抽屉和状态操作。
- `admin-web/src/views/badges/index.vue`：卡片/配置编辑。
- `admin-web/src/views/stats/index.vue`：KPI 和分布布局。
- `admin-web/src/constants/nav.ts`、`router/index.ts`：导航和路由。

建议新增 API 文件：

```text
admin-web/src/api/community.ts
admin-web/src/api/checkin.ts
admin-web/src/api/achievement.ts
```

社区分页和审核筛选不建议继续塞进 `kitchen.ts`；可新增：

```text
admin-web/src/stores/community.ts
```

### 6.2 页面

建议新增：

```text
admin-web/src/views/community/posts.vue
admin-web/src/views/community/topics.vue
admin-web/src/views/checkins/index.vue
admin-web/src/views/checkins/statistics.vue
admin-web/src/views/achievements/index.vue
admin-web/src/views/achievements/statistics.vue
```

实际命名可适配现有目录，但必须覆盖以下能力。

#### 原型页面与 Vue 页面映射

| 管理端原型 View | Vue 页面建议 | 数据来源 | 关键操作 |
|---|---|---|---|
| `view-dash` | 现有 `stats/index.vue` 或工作台首页 | 社区、打卡、成就、退款聚合接口 | 待审核内容直达、异常计数直达 |
| `view-community` | `community/posts.vue` | 帖子分页和状态统计 | 审核通过、精选、下架、恢复 |
| `view-comments` | `community/comments.vue` | 评论与举报分页 | 隐藏、恢复、标记已处理 |
| `view-checkins` | `checkins/index.vue` | 打卡分页 | 查看照片、关联行程、位置和海报 |
| 原型徽章页旁新增 | `achievements/index.vue` | 成就定义和用户进度统计 | 新增、编辑、启停、删除前检查 |
| 统计页新增区块 | `achievements/statistics.vue` | 解锁人数、解锁率、进度分布 | 时间/类型筛选、导出 |

管理端不得把社区帖子、评论和打卡混成一个通用内容表格。三者的审核含义、可操作状态和隐私范围不同，必须保持独立路由或清晰的独立页签。

#### 全量管理端模块对照矩阵

| 原型 View | 正式页面 | 列表/面板必须展示 | 详情与主要动作 | 对应用户端影响 |
|---|---|---|---|---|
| `view-dash` 工作台 | `dashboard/index.vue` | 支付/开盒/用户 KPI，退款、社区、攻略、打卡待办，热门盲盒 | 带筛选跳转；热门盲盒进入编辑；异常订单/退款直达详情 | 首页商品与运营状态、社区审核时效 |
| `view-stats` 数据统计 | `stats/index.vue` | 今日/7日/30日，开盒量、成交额、客单价、退款率、新增，转化漏斗、称号/心情分布 | 时间筛选、指标口径说明、导出 | 只读聚合；成交仅统计支付成功且未退款 |
| `view-boxes` 盲盒管理 | `boxes/index.vue` | 分类、状态、排序、售价、保底、适配心情、开盒量、封面 | 新建/编辑/上下架/排序；预览用户端商品卡与详情 | 首页、商品广场、详情、购物车、帖子同款卡 |
| `view-routes` 线路管理 | `routes/index.vue` | 目的地、分类、票面、保底适配、徽章、状态、抽中量、攻略完整度 | 线路编辑；攻略查看/编辑；上下架；校验随机池 | 开盒候选池、结果、行程/攻略详情、打卡地点 |
| `view-badges` 徽章管理 | `badges/index.vue` | 12 枚徽章、标记、关联线路、解锁量、状态 | 编辑名称/图标/说明/关联；预览锁定/解锁态 | 用户图鉴；不得混入行为成就 |
| `view-banners` 运营位 | `banners/index.vue` | 标题、副标题、标签、图片、跳转、排序、启用状态 | 新建/编辑/预览/启停/排序，校验跳转目标 | 首页会员横幅/运营入口 |
| `view-ai` AI 搭子 | `ai-config/index.vue` | 人设提示词、欢迎语、快捷问题、失败降级、日记模板、启用状态 | 编辑、增删快捷问题、测试预览、发布版本/回滚 | AI 对话、推荐卡和行程 AI 日记 |
| `view-quiz` 人格测试 | `personality/index.vue` | 5 道题、选项、4 类人格、推荐方向、版本 | 编辑题目/选项/计分/结果，预览完整作答，发布前校验 | 图鉴入口的人格测试和推荐结果 |
| `view-community` 社区内容 | `community/posts.vue` | 五状态、封面/标题/地点、作者、话题/关联盲盒、赞评藏、时间 | 内容详情；通过、精选、下架、恢复；联查用户/商品/行程/打卡 | 社区发现、关注、话题、帖子详情和收藏 |
| `view-comments` 评论审核 | `community/comments.vue` | 评论、帖子、用户、父评论、来源、举报原因、状态 | 查看上下文，隐藏/恢复/处置举报 | 帖子评论可见性和计数 |
| `view-checkins` 打卡记录 | `checkins/index.vue` | 地点、照片、用户、行程、时间、点赞、成就、海报、状态 | 照片/位置/备注/海报详情；联查行程与用户 | 打卡详情、榜单、成就进度 |
| `view-orders` 订单支付 | `orders/index.vue` | 单号、用户、盲盒快照、金额、渠道、状态、结果、时间 | 订单详情；联查支付、路线、行程、退款；原则上只读 | 我的订单、支付、开盒、行程 |
| `view-refunds` 退款审核 | `refunds/index.vue` | 退款单、原订单、用户、原因、金额、人工/自动、状态 | 人工通过/驳回、填写原因、查看渠道回执；自动退只读 | 退款进度、订单状态、行程有效性 |
| `view-trips` 行程记录 | `trips/index.vue` | 用户、线路/目的地、日期、购入/票面、攻略完整度、有效性 | 行程快照、分时路线、景点、订单、打卡；进入攻略管理 | 我的行程、行程详情、攻略、打卡 |
| `view-users` 用户管理 | `users/index.vue` | ID、昵称/微信名、渠道、出行、社区、称号、消费、省钱、最近登录、状态 | 身份/偏好/资产/成长四页签；联查订单/内容/打卡/成就；启禁用 | 登录和全部写操作权限、个人中心统计 |
| `view-settings` 系统设置 | `settings/index.vue` | 价值保底文案、情绪匹配、公益、待支付超时、等级规则、角色说明 | 校验后保存、版本记录、审计；高风险配置二次确认 | 首页/商品规则、倒计时、称号和公益里程 |
| `view-tokens` 视觉规范 | `design-tokens/index.vue` 或只读文档页 | 品牌颜色、字体、间距、圆角、阴影、控件节奏 | 复制 Token、组件预览；正式环境只读或受控发布 | 用户端和管理端共用视觉语言 |

每个表格页都必须包含真实分页、筛选重置、加载、空、网络错误、403 和并发冲突状态；每个 Drawer 必须从详情接口重新取数据，不能只把表格行对象直接当完整详情。保存成功后同时更新 Drawer、列表、工作台 KPI 和受影响用户端缓存。

#### 盲盒、线路、攻略、徽章与运营位

- 盲盒编辑字段至少包括 `boxId/name/category/tag/description/price/guarantee/moods/cover/status/sort`；价格和保底校验使用分/整数口径，保存前展示用户端卡片与详情预览。
- 线路编辑字段至少包括名称、目的地、分类、票面价值、徽章、心情文案、亮点、服务包含、封面、状态和权重。上线前校验票面价值满足所关联盲盒保底，且同分类至少有一条可用线路。
- 攻略 Drawer/编辑页逐区块维护分时路线、景点看点/提醒、交通、餐住、费用、清单、Plan B、安全和 FAQ，并显示完整度；发布新版本不得覆盖历史行程快照。
- 徽章页保留十二枚线路印章及关联线路/解锁量；行为成就另建页面。停用徽章不移除用户已解锁历史。
- 运营位必须校验图片、起止时间、排序和跳转类型/目标 ID；目标下架时禁止发布或自动显示失效风险，用户端不得点击后落到空白页。

#### AI 搭子与人格测试配置

- AI 配置区分 system prompt、欢迎语、快捷问题、推荐规则、失败降级和日记模板；保存草稿与发布版本分离，发布/回滚写审计。
- 在线预览不得访问或写入真实用户资产；模型输出中的商品/线路引用必须从服务端目录解析，禁止模型虚构价格或替用户开盒。
- 人格测试固定校验 5 道启用题、每题完整选项、每个选项计分和 4 类结果；发布前跑一遍可达性检查，确保每种人格都存在可达答案组合。
- 用户已完成的测试结果记录版本号；后台改题不应改写历史结果，重测时使用最新已发布版本。

#### 帖子审核

- 页面头显示“社区内容审核”、说明文案和待审核数量 Pill；待审核大于 0 时使用等待状态色。
- 顶部筛选严格对齐原型：全部、待审核、已发布、精选、已下架；另补关键词、话题、日期和作者筛选。
- 表格列对齐原型：封面+标题+地点、作者+来源、话题+关联盲盒、赞/评/藏、发布时间、状态、审核入口。
- 用户端刚发布的内容在同一分页排序下置顶或按创建时间排序，来源标记为“用户端”，不能与 seed 演示数据混淆。
- 详情 Drawer 展示标题、作者、地点、时间、状态、多图、完整正文、话题、互动、关联盲盒/打卡/行程和最新评论。
- 关联盲盒卡可跳转盲盒详情；关联行程可跳只读行程详情；关联打卡可跳打卡详情。
- 状态动作包括“审核通过”“设为精选”“下架内容”“恢复发布”；下架/驳回要求填写原因。
- 保存成功后更新 Drawer 状态、列表状态、工作台待办和用户端可见性，并显示 Toast。
- 403、网络错误、空数据、加载态、图片失效和内容已被其他管理员处理等状态必须真实展示。

推荐状态映射：

| 页面文案 | API 状态 | 用户端可见 | 可执行后续动作 |
|---|---|---:|---|
| 待审核 | `review` | 否 | 通过、下架/驳回 |
| 已发布 | `published` | 是 | 精选、下架 |
| 精选 | `featured` | 是，排序可提升 | 取消精选、下架 |
| 已下架 | `down` | 否 | 恢复发布 |
| 已删除 | `deleted` | 否 | 只读审计，不物理删除 |

#### 话题管理

- 列表展示话题名称、封面、描述、帖子数、关注数、浏览量、热度/排序、状态和更新时间。
- 创建/编辑抽屉包括名称、短描述、封面、排序、状态；名称唯一，显示名称由服务端规范化 `#` 前缀。
- 支持创建、编辑、排序、上下架和删除前引用检查；已有帖子引用时只能下架，不能物理删除。
- 用户端“话题”视图和发布页选择器必须读取同一启用话题列表，不允许页面保存不存在或已停用的 `topicId`。

#### 打卡管理与统计

- 页面头沿用原型“打卡记录 / 地点、照片与成就进度”，顶部增加总量、今日、本周、本月四个 KPI。
- 按用户、线路、地点、日期、有效状态和是否生成海报筛选。
- 列表/卡片展示首图、地点、用户、关联行程、打卡时间、备注摘要、点赞数、新解锁成就和海报状态。
- 详情 Drawer 展示全部照片、模糊位置、备注、关联线路/行程快照、点赞用户摘要、成就检查结果和分享海报。
- 只读详情不提供未授权修改用户打卡正文；若后续增加违规处置，必须复用内容审核状态与审计机制。
- 统计展示地点分布、线路分布、打卡排行、海报生成成功率和打卡后发帖转化率。

#### 成就管理与统计

- 必须与现有“徽章管理”分开：徽章对应开盒线路图鉴，成就对应打卡/行程/发帖/消费等行为。
- 成就定义 CRUD：code、名称、描述、图标、类型、阈值、等级、排序、状态和解锁文案。
- 编辑 Drawer 同时显示用户端成就卡片预览，包括锁定、进行中、刚解锁和已解锁四种状态。
- 奖励字段只展示 `rewardType/rewardValue/rewardSent` 结构，不在 Phase 5 实际发券、发积分或发盲盒。
- 删除前检查用户进度和引用；已有用户进度时只能停用。
- 统计解锁人数、解锁率、当前进度分布、首次解锁时间趋势和重复检查幂等异常数。

#### 评论审核

- 列表列对齐原型：评论正文、关联帖子、用户、来源、举报原因、状态、操作。
- 支持全部/正常/被举报/已隐藏筛选，并支持关键词、帖子 ID、用户 ID 查询。
- 详情展示父评论/回复关系和上下文，避免只看单句导致误判。
- 隐藏评论后用户端评论计数按冻结口径更新；恢复时同样保持明细与计数一致。
- 评论处置不能自动改变帖子状态；如需同时下架帖子，必须由管理员执行第二个明确动作。

#### 工作台与跨模块联查

- 工作台待办至少包括待审核帖子、待处理举报、待审核退款和攻略不完整线路。
- 点击待办应携带筛选条件进入目标页，而不是只切换导航。
- 社区 Drawer 的关联盲盒、行程、打卡和用户均可进入对应详情；返回时保留原筛选和页码。
- 用户详情增加帖子、评论、打卡和成就摘要；禁用用户后的历史内容可见性按 7.1 的冻结规则执行。

#### 订单支付、退款审核与行程记录

- 订单页筛选严格覆盖 `pending_pay/paid/opened/cancelled/refunded`。表格行不能把 `paid` 显示为“已开盒”，也不能用退款申请状态覆盖原订单状态。
- 订单 Drawer 展示订单号、用户、商品快照、实付、渠道、下单/支付/过期时间、全部支付尝试、开盒结果、退款和关联行程。路线、行程、用户、退款均可继续联查。
- 管理端不提供“手工改为已支付/已开盒”按钮；异常修复必须走受审计的补偿接口，并限制 `super_admin`。
- 退款页区分人工申请与自动退款。人工处理前再次校验订单/行程状态和并发版本；通过/驳回必须填写原因，成功后同时刷新订单、行程、用户统计和用户端状态。
- 自动退款只读，不出现通过/驳回按钮；展示触发原因、原订单、渠道退款号和到账状态，重复回调不得生成第二笔退款。
- 行程页展示开盒时的线路与攻略快照，而不是只实时关联当前线路模板；已退款行程保留并降低视觉权重，标明失效时间和退款单。

#### 用户、系统设置与视觉规范

- 用户详情固定为身份、偏好、资产、成长四页签：身份含微信/手机号/渠道/状态；偏好含心情与人格版本；资产含订单/行程/徽章/收藏；成长含帖子/评论/打卡/成就和消费统计。
- 用户禁用前二次确认并填写原因；禁用后立即阻止开盒、支付发起和所有内容写操作。历史内容是否公开按冻结规则处理，不能由管理端页面自行决定。
- 系统设置中的保底文案、情绪文案、公益金额、支付超时和等级规则都要有类型/范围校验、保存审计和最近发布版本；支付超时改变只作用于新订单。
- 视觉规范页面按原型显示颜色、字体和元件节奏，并与小程序 WXSS、管理端 CSS Token 建立名称映射；它是验收基准，不是任意改色工具。

#### 详情 Drawer 与跨模块返回规则

| 当前详情 | 可联查目标 | 打开方式 | 返回要求 |
|---|---|---|---|
| 盲盒 | 关联线路、用户端商品预览、相关帖子 | Drawer 内链接/新 Drawer 栈 | 返回保留分类、状态和页码 |
| 线路/攻略 | 关联盲盒、行程、徽章 | Drawer 栈 | 返回保留攻略编辑草稿，未保存需确认 |
| 社区帖子 | 作者、盲盒、行程、打卡、评论 | Drawer 栈 | 返回保留审核筛选和当前帖子 |
| 订单 | 用户、支付流水、盲盒、路线、行程、退款 | Drawer 栈 | 返回订单筛选和滚动位置 |
| 退款 | 原订单、用户、行程 | Drawer 栈 | 返回退款状态和当前待办 |
| 行程 | 订单、线路攻略、打卡 | Drawer 栈 | 返回行程有效性筛选 |
| 用户 | 订单、帖子、评论、打卡、成就 | 页签内联查 | 返回用户档案原页签 |

Drawer 使用显式详情栈或面包屑，不允许打开新详情时销毁上一层筛选上下文。浏览器前进/后退、刷新和复制管理端 URL 至少能恢复当前模块与目标 ID；无权限目标显示 403，不静默退回工作台。

### 6.3 导航

在 `admin-web/src/constants/nav.ts` 和 `admin-web/src/router/index.ts` 对齐管理端原型的“内容”分组：

```text
内容
- 社区内容
- 评论审核
- 打卡记录
- 话题管理
- 成就管理
```

前三项与当前原型名称一致，话题管理和成就管理是正式实现为 Phase 5 补充的页面。沿用 `Sidebar.vue` 自动渲染，不另建布局体系。页面标题、图标、面包屑和路由权限必须与现有管理端一致。

### 6.4 管理端页面状态与操作一致性

- 列表筛选写入 URL query，刷新可恢复；从 Drawer 返回时不丢失筛选、页码和排序。
- 写操作按钮显示 `idle/confirming/submitting/success/error`，提交中禁重复；409 并发冲突时重新加载详情并提示记录已变化。
- 所有危险操作使用明确动词和对象名称，要求原因的操作不能只弹“确定吗”。
- 角色无权限时路由守卫阻止进入、按钮不显示、接口仍返回 403；三层约束缺一不可。
- 用户端受影响的数据采用失效标签或版本号刷新；后台保存成功但用户端仍长期读取旧缓存视为未完成。
- 全局搜索至少能按订单号、退款单号、用户 ID/手机号、帖子 ID 和行程 ID 定位，并跳入相应详情。

### 6.5 管理端 UI 视觉系统与响应式规范

管理端继续使用与用户端同源的奶油纸张与鼠尾草体系，但界面目标是高信息密度运营工具，不能把每个页面做成营销式大卡片。颜色值必须复用 5.12；额外允许 `--caramel: #D4924A`、`--bread: #E8C9A0`、危险色 `#F3DDD4/#A15B48`。状态不能只依赖颜色，必须同时展示中文文案或图标。

#### 桌面布局基线

| 区域 | 1440×900 主视口 | 1280×800 / 1024×768 适配 |
|---|---|---|
| 应用骨架 | 左侧导航 228px + 右侧弹性工作区，整屏不出现 body 滚动 | ≤1100px 导航 196px；工作区保持最小宽度并内部滚动 |
| 左侧导航 | 鼠尾草到奶油纵向过渡，分组标签 10px，菜单 13px，行高约 36px | 保留文字与图标；不折叠成仅图标，除非另有产品决策 |
| 顶部云头 | `#E3EDD6 → #E8F0DC`，左右 gutter，问候/标题/说明 + 搜索/快捷操作 | 1024px 隐藏吉祥物和吊灯，搜索仍可用且不覆盖标题 |
| 主工作区 | `padding: 18px clamp(16px,2vw,32px) 32px`，单一纵向滚动容器 | 双栏/运营看板在容器 ≤860px 时叠成单栏 |
| 页面头 | 24px 衬线标题、12px 说明、右侧明确操作 | 窄屏操作允许换行，按钮不得被标题挤出 |
| 表格 | 纸白容器、18px 圆角，表头雾绿、最小宽 720px，行 12×14px 内边距 | 保持横向滚动，不把每行强行改成卡片导致字段丢失 |
| 详情 Drawer | 遮罩 `rgba(60,52,44,.28)`，宽 `min(620px,100%)`，奶油底，22px 内边距 | 1024px 仍从右侧进入；窄于 620px 时占满宽度 |
| Toast | 底部居中纸白气泡、墨色边、异形圆角 | 不遮挡 Drawer 主动作；同一时刻只展示一条 |

当前 `admin-web/src/assets/styles/kitchen.css` 的 Drawer 宽度为 `min(480px,100%)`，而最新管理端原型是 `min(620px,100%)`；Phase 5 必须统一到 620px，确保社区多图、订单联查和完整攻略字段不拥挤。所有页面内容仍使用单层工作区，不允许在 `.paper/.sheet` 内再套装饰卡片。

#### 管理端组件样式

| 组件 | 规格 | 状态规则 |
|---|---|---|
| 搜索框 | 高 40px、纸白、胶囊圆角、轻阴影，搜索按钮高 30px | 聚焦边/图标变深绿；无结果进入当前页面空态 |
| 主/次按钮 | 高 38px，主绿/墨色/纸白三类，胶囊圆角 | Hover 主绿转深绿；提交中尺寸不变；危险操作使用柔红而非主绿 |
| 筛选 Chip | 12px 字、`6px 12px`、胶囊 | 默认 `cream-2/muted`，选中 `sage/white`，禁用保持可读 |
| KPI | 纸白、14px 圆角、10×12px 内边距、轻阴影 | 数值 18–23px；涨跌/异常需文字说明 |
| 数据表 | 表头 11px 深绿、`.12em` 字距；单元格 13px | Hover `#FBF8F1`；加载用固定行骨架；空态不保留空白大表 |
| 状态 Pill | 高 22px、11px 字、胶囊 | 默认雾绿/深绿；等待奶油/焦糖；成功主绿/白；失败柔红/棕红 |
| 表单 | Label 11px 深绿；输入 14px、1.4px 边、14px 圆角 | Focus 为主绿；校验失败显示字段级错误，不只 Toast |
| Switch | 40×22px，滑块 16px | 开启主绿；关闭 cream-2；禁用显示原因 Tooltip |
| 图片 | 商品 16:10；头像/缩略图 36px；社区封面 62×48px | 统一 `object-fit: cover` 和占位图，失败不能撑破行高 |
| Drawer KV | 13px，8px 上下内边距，虚线分隔 | 长值可换行/复制；ID 和订单号使用等宽数字风格 |

#### 页面组视觉要求

| 页面组 | 样式与布局要求 |
|---|---|
| 登录 | 左侧实景/品牌故事、右侧纸白登录区的双栏；≤980px 改单栏；角色 Chip、账号输入、错误和登录中状态完整 |
| 工作台/统计 | KPI 横排、任务列表和图表双栏；图表优先条形/漏斗/环形，不使用与品牌无关的炫彩渐变 |
| 盲盒/线路/徽章/运营位 | 列表与编辑 Drawer 为主；用户端预览宽约 210–260px；图片与价格样式必须和小程序预览同源 |
| AI/人格测试 | 左侧配置表单、右侧预览/测试结果；草稿、已发布版本和回滚状态有清晰标签 |
| 社区/评论/打卡 | 高密度表格 + 620px Drawer；多图、正文、上下文、位置和关联对象分区，不堆叠多层卡片 |
| 订单/退款/行程 | 状态筛选 + 表格 + 联查 Drawer；订单号/金额/渠道/时间纵向对齐；危险操作放 Drawer 底部固定动作区 |
| 用户 | 表格进入身份/偏好/资产/成长四页签 Drawer；禁用按钮与普通编辑视觉分离 |
| 设置/视觉规范 | 设置按业务域分组，危险设置二次确认；Token 页面显示准确色块、字体和组件样例，不允许在线随意改品牌色 |

管理端样式代码以 `kitchen.css` 的 Token/基础组件为唯一全局来源，页面 `.vue` 的 scoped style 只写局部网格和特殊区块：

```css
.refund-page__summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.refund-page__reason { color: var(--muted); line-height: 1.6; }
```

禁止用内联十六进制颜色复制状态；禁止为每个页面再定义一套按钮、Pill、表格或 Drawer；禁止用可点击的纯文字代替已有图标按钮而没有 Tooltip/可访问名称。

### 6.6 管理端前端文件级修改清单

| 文件/目录 | 当前状态 | Phase 5 修改内容 |
|---|---|---|
| `admin-web/src/assets/styles/kitchen.css` | 已有主要原型样式，部分尺寸与最新原型不一致 | 冻结 Token、字体、布局、按钮/表格/Pill/表单/Drawer/Toast；Drawer 改 620px；补空错骨架和响应式 |
| `admin-web/src/App.vue`、`components/layout/AppLayout.vue` | 已有应用骨架 | 保持单一滚动工作区、全局 Drawer/Toast Host、权限错误页和纸张纹理层 |
| `components/layout/Header.vue` | 已有顶部区域 | 对齐云朵头、标题/说明、全局搜索、角色/快捷动作和窄屏隐藏策略 |
| `components/layout/Sidebar.vue`、`constants/nav.ts` | 已有导航 | 补内容/话题/成就等路由，按原型分组顺序、图标、激活和角色隐藏 |
| `components/kitchen/PageHead.vue` | 已有 | 固定标题/说明/右侧操作/待办 Pill 结构，避免页面自建不一致头部 |
| `components/kitchen/KitchenDrawer.vue`、`DrawerHost.vue` | 已有基础 Drawer | 620px、详情栈/面包屑、加载/403/409、固定底部动作、关闭确认和焦点恢复 |
| `KitchenToast.vue`、`ProductCard.vue`、`GuestCell.vue` | 已有 | 统一反馈、用户预览、图片失败和长文本；不得在各页面复制变体 |
| `views/auth/login.vue` | 已有 | 对齐双栏登录原型、五角色演示/正式映射、错误/加载/记住状态和 980px 响应式 |
| `views/dashboard/index.vue`、`views/stats/index.vue` | 已有 | 对齐 KPI、待办、漏斗、分布、时间范围和带筛选跳转 |
| `views/boxes/index.vue`、`views/routes/index.vue` | 已有 | 补用户端预览、完整攻略 Drawer/编辑、保底校验、上下架与全状态 |
| `views/badges/index.vue`、`views/banners/index.vue` | 已有 | 补 12 徽章状态、运营位预览/跳转校验/排序和空错态 |
| `views/ai/index.vue`、`views/quiz/index.vue` | 已有 | 增加草稿/发布/回滚、在线预览、测试版本与结果可达性反馈 |
| `views/orders/index.vue`、`views/refunds/index.vue`、`views/trips/index.vue` | 已有 | 对齐完整状态筛选、620px 联查 Drawer、人工/自动退、攻略快照和审计反馈 |
| `views/users/index.vue` | 已有 | 增加四页签档案、社区/打卡/成就摘要、联查和启禁用确认 |
| `views/settings/index.vue`、`views/tokens/index.vue` | 已有 | 补配置版本/生效边界/高风险确认；展示准确 Token 与双端组件样例 |
| `views/community/posts.vue`、`comments.vue` | 缺失 | 新增帖子审核和评论上下文页面，复用表格、Drawer、Pill 和分页状态 |
| `views/checkins/index.vue`、`statistics.vue` | 缺失 | 新增打卡列表/详情/统计，照片和位置按隐私规则展示 |
| `views/achievements/index.vue`、`statistics.vue` | 缺失 | 新增成就 CRUD、四状态预览、解锁率和进度分布 |
| `views/community/topics.vue` | 缺失 | 新增话题表格与编辑 Drawer、排序/启停/引用检查 |
| `api/*.ts` | 已有目录/交易/用户等 API，社交域缺失 | 新增 community/checkin/achievement；现有文件补详情、筛选、并发版本和错误类型 |
| `router/index.ts`、`types/index.ts`、`types/kitchen.ts` | 路由和类型未覆盖新模块 | 注册新页面/Meta 权限；补统一 DTO、状态 Union、Drawer 目标和筛选类型 |

每个 Vue 页面必须优先组合现有 `PageHead/useTable/KitchenDrawer/KitchenToast`，禁止另建平行布局体系。新页面在接真实接口前可使用与 OpenAPI 同结构的 fixture，但合并前必须删除影响生产的 mock 分支。

---

## 7. 数据、安全与一致性

### 7.1 内容可见性

公开列表、详情、话题计数和榜单只允许 `status IN ('published','featured')`，必须过滤：

- `status = review`；
- `status = down`；
- `status = deleted`；
- 按项目规则应隐藏的禁用用户内容。

必须冻结禁用用户已有内容规则：隐藏、保留或匿名化三选一，并在 SQL 和验收用例中落实。

### 7.2 关联对象归属

发帖关联对象不能只校验 ID 存在：

- `linkedTripId` 必须属于当前用户；
- `linkedCheckinId` 必须属于当前用户或满足公开引用规则；
- `linkedBlindBoxId` 必须处于允许展示状态；
- 失效行程是否允许发布关联内容要按冻结规则处理；
- 不存在或无权限统一返回明确的 404/403，不静默接受。

### 7.3 计数与互动

- 点赞/收藏使用唯一键和事务，重复请求幂等。
- 删除互动与减少计数同一事务执行。
- 计数更新不得小于 0。
- 评论数量以实际有效评论或冻结的计数规则为准。
- seed 中现有演示计数若没有明细记录，要么补齐明细，要么明确为演示快照，不能在业务测试中假设二者必然一致。

### 7.4 成就与奖励

- 进度不能由客户端传入。
- 有效行程、有效订单、正常帖子和用户徽章的统计口径必须写入契约。
- 已解锁成就是否回锁必须冻结；推荐不回锁。
- `reward_sent` 必须幂等；失败可重试，不能先标记成功。
- 阶段五不实际发放优惠券、盲盒或积分奖励；奖励兑现交给阶段六。

### 7.5 隐私和图片

- 图片 URL、GPS 和用户生成内容都经过服务端验证。
- 公开详情默认不暴露精确经纬度，除非用户明确选择公开且契约允许。
- 图片上传文件名由服务端生成，限制格式和大小。
- 任何本地临时路径不得落库。

### 7.6 用户端与管理端字段对照

| 用户端展示/动作 | 核心字段 | 管理端展示/动作 | 一致性要求 |
|---|---|---|---|
| 商品卡/详情 | `boxId/name/price/guarantee/status/version` | 盲盒管理和用户端预览 | 同一商品 ID/版本；下架立即禁止新订单，历史使用快照 |
| 完整攻略 | `routeId/guideVersion/snapshotId` | 线路攻略查看/编辑 | 新版本作用于新行程，历史行程读取快照 |
| 创建订单 | `orderNo/boxSnapshot/amount/status/expireAt` | 订单支付列表/详情 | 倒计时使用同一 `expireAt`，金额和商品快照不可被前端改写 |
| 支付记录 | `paymentNo/orderNo/channel/amount/status/paidAt` | 订单详情支付流水 | 支付发起与支付成功分离；重复回调不重复记账 |
| 开盒结果 | `orderNo/resultId/routeId/tripId` | 订单结果、行程记录 | 同一订单永久同一结果；动画不生成或修改这些字段 |
| 退款进度 | `refundNo/orderNo/type/status/reason/rejectReason` | 退款审核/自动退详情 | 人工/自动类型一致；通过后订单与行程同步 |
| 行程详情 | `tripId/orderNo/routeSnapshot/validity` | 行程记录和攻略联查 | 历史快照一致；退款后两端均显示失效而非删除 |
| 帖子卡标题、首图、作者 | `postId/title/coverUrl/author` | 审核表“帖子”“作者/来源” | 同一帖子 ID，不用标题匹配记录 |
| 话题 Chip | `topicId/topicName` | 审核表话题、话题管理 | 名称改动后两端同步，关联保留 ID |
| 地点标签 | `locationName/publicLocation` | 审核详情地点、打卡详情 | 用户端只展示允许公开的模糊位置 |
| 关联盲盒“抽同款” | `linkedBlindBoxId` | 审核详情关联盲盒 | 商品下架后保留历史快照但禁止新开盒 |
| 点赞/收藏/评论数 | `likeCount/collectCount/commentCount` | 审核列表互动列 | 明细与冗余计数同事务更新 |
| 发布成功 | `status=review/published` | 待审核/已发布 | 采用哪种初始状态必须在契约冻结 |
| 管理员精选 | `status=featured` 或 `featured=true` | “精选”筛选 | 用户端推荐排序可提升但不伪造热度 |
| 管理员下架 | `status=down`、`moderationReason` | “已下架”与审计 | 用户端立即不可见，作者可见原因按产品规则 |
| 打卡成功 | `checkinId/tripId/routeId` | 打卡记录与关联行程 | 必须是本人有效行程，不能只靠线路 ID |
| 成就解锁 | `achievementCode/progress/unlockedAt` | 成就统计与用户详情 | 重复检查不得产生第二次解锁或奖励 |

正式接口不得沿用原型中通过 `localStorage` 合并数据的做法。联调环境至少准备一条“用户端发布 → 管理端审核 → 用户端可见”的真实数据库记录作为验收基准。

### 7.7 缓存、快照与刷新

- 本地缓存只用于页面加速、草稿、筛选和非关键购物车标识；订单、支付、开盒结果、退款、行程、内容状态和计数必须以服务端为准。
- 商品/线路实时目录可缓存，但响应包含版本或更新时间；管理端上下架/发布后触发失效或让客户端在下一次进入时重新验证。
- 订单保存商品快照，行程保存路线和攻略快照，帖子关联区至少保存可审计的展示快照；实时实体下架不应让历史记录字段消失。
- 页面 `onShow` 对支付、订单、退款和审核结果执行轻量刷新；列表合并按稳定 ID 去重，禁止用标题、昵称或时间字符串当主键。
- 管理端统计和用户端计数如采用异步聚合，必须标注最大延迟并提供校正任务；核心交易状态不得最终一致到用户无法判断是否支付成功。

---

## 8. 四周排期

| 工作日 | 任务 | 交付检查 |
|---|---|---|
| 第 1 天 | 阶段四交接复核；逐项盘点用户/管理原型、`app.json`、overlay、admin 路由和现有接口；固定 U/A 视觉基线 | 页面/状态/样式差异表、基线截图、未实现清单 |
| 第 2 天 | 冻结 TabBar、页面路径、详情参数、交易/社交状态与权限，以及颜色/字体/间距/圆角/阴影 Token | `v5-contract-freeze` + `v5-visual-freeze`，无待猜字段/样式 |
| 第 3 天 | 更新契约/数据库文档；修复 schema/seed；注册页面骨架；完成小程序/管理端共用样式、字体和路由基础 | 所有页面可导航且有加载态；基础组件双端截图通过 |
| 第 4 天 | 后端社区/打卡/成就 Entity/Mapper/DTO/VO、上传和归属校验；小程序状态模块拆分 | 后端结构测试、前端无超大新增全局状态 |
| 第 5 天 | 首页、商品广场、商品详情、购物车对齐；管理端盲盒字段与预览联调 | 商品入口、筛选、加购、下架态闭环 |
| 第 6 天 | 完整攻略、行程详情、AI 日记；管理端线路/攻略/徽章对齐 | 模板与历史快照区分，攻略全部区块可验收 |
| 第 7 天 | 订单列表/详情、支付记录和“我的”入口；管理端订单详情联查 | 五类订单状态、支付流水、返回栈正确 |
| 第 8 天 | 支付页倒计时、沙箱链接/二维码、1800ms 轮询、前后台恢复、继续支付/取消 | 支付成功/失败/超时/重入录屏与测试 |
| 第 9 天 | `unbox-animation` 完整时间轴、服务端幂等结果、动画后结果页和行程跳转 | 2700ms 动画、文案轮换、禁关和降级录屏 |
| 第 10 天 | 退款申请/详情、自动退、购物车结算边界；管理端退款/行程联查 | 人工通过/驳回、自动退、订单/行程同步 |
| 第 11 天 | 社区列表、发现/关注/话题/达人、分页刷新和收藏入口 | 四视图、分类、空态、真实数据 |
| 第 12 天 | 帖子详情、发布、图片上传、草稿、点赞/收藏/评论/关注 | 发布到审核、互动幂等和失败恢复 |
| 第 13 天 | 打卡创建、图片/位置/备注、成功页、海报、详情和榜单 | 本人有效行程打卡闭环录屏 |
| 第 14 天 | 成就计算、列表/详情/解锁弹窗；图鉴与成就入口彻底分离 | 重复检查不重复解锁，四种视觉状态 |
| 第 15 天 | 管理端工作台、统计、盲盒、线路/攻略、徽章、运营位全量对照 | 列表/Drawer/操作/跳转/空错态通过 |
| 第 16 天 | 管理端 AI、人格测试、社区、评论、打卡、话题、成就 | 配置发布、内容审核、统计与审计通过 |
| 第 17 天 | 管理端订单、退款、行程、用户、系统设置、视觉规范和全局搜索 | 权限、详情栈、跨模块联查和审计通过 |
| 第 18 天 | 用户端 → 支付 → 开盒 → 行程 → 打卡 → 发帖 → 管理审核全链路联调 | 同一 ID/状态/计数贯穿三端 |
| 第 19 天 | 安全、并发、跨用户、初始化、构建、弱网/前后台、双视口视觉回归 | P0/P1 清零，回归证据归档 |
| 第 20 天 | 缓冲修复、完整原型对照、验收材料、已知问题和阶段六交接 | Phase 5 验收包签字归档 |

### 8.1 分工建议

| 角色 | 负责内容 |
|---|---|
| 后端 A | 契约、schema、交易状态复核、社区/打卡/成就服务、上传、权限、审计和测试 |
| 小程序 B | 商品/攻略/订单/支付/开盒动画/退款/行程/AI/我的页面和状态恢复 |
| 小程序 C | 社区、发布、互动、打卡、成就、图片/海报和移动端原型对照 |
| 管理端 D | 17 个管理模块、详情 Drawer、全局搜索、权限、审计和跨模块联查 |

并行原则：第 1–2 天只冻结契约和数据库；第 3 天后四条工作流基于冻结字段并行。上传存储、支付恢复、开盒幂等、`trip_id` 归属和权限不能拖到最后联调。若实际只有 1–2 名开发者，则拆为 Phase 5A（交易与原型基础）和 Phase 5B（社交/打卡/成就与管理端），完成定义保持不变，不能通过删页面压回 14 天。

### 8.2 前端可执行任务包

以下任务按依赖顺序领取。页面目录中的 `.js/.json/.wxml/.wxss` 计为 4 个文件；除共享基础任务外，每个任务最多修改 5 个文件。发现必须跨 5 个以上文件时，先拆任务并更新本计划。

| 任务 | 内容 | 文件（≤5） | 验收 | 验证 |
|---|---|---|---|---|
| UI-01 | 冻结小程序 Token、字体和通用组件样式 | `app.wxss`、最多 4 个字体/占位资产 | 5.12 色值、字号、按钮、Chip、卡片、状态全部有唯一实现 | 扫描 WXSS 色值；390/375 基础组件截图 |
| UI-02 | 注册页面和对齐 TabBar | `app.json`、`custom-tab-bar` 4 文件 | 页面均可进入；选中/未选中、72px 高度和安全区与原型一致 | 微信开发者工具编译；逐 Tab 截图 |
| U-01 | 商品广场 | `pages/market/` 4 文件、必要时 1 个复用组件 | 分类、双列卡、加购、开盒、空错/下架态完整 | U02 截图；JS 语法检查 |
| U-02 | 商品详情 | `pages/product/` 4 文件、1 个商品 API 调整 | Hero、价格/保底、服务、攻略和粘底动作对齐 | U02 截图；真实 `boxId` 深链 |
| U-03 | 完整攻略 | `pages/guide/` 4 文件、1 个攻略 API 调整 | 5 锚点和全部攻略区块、模板/快照模式完整 | U03 长页录屏；无缺失区块 |
| U-04 | 购物车 | `pages/cart/` 4 文件、1 个购物车 Store | 空态、失效商品、金额和逐单结算规则完整 | U04 截图；价格重新校验 |
| U-05 | 订单列表 | `pages/orders/index` 4 文件、1 个订单 Store | 四筛选、所有状态卡和可用动作正确 | U06 截图；状态矩阵用例 |
| U-06 | 订单详情 | `pages/orders/detail` 4 文件、1 个 API 调整 | 商品/支付/结果/行程/退款联查和刷新完整 | `orderNo` 深链、重入、越权用例 |
| U-07 | 支付记录 | `pages/payment-records/` 4 文件、1 个 API 调整 | 多次支付尝试、渠道/金额/终态和空态完整 | U06 截图；支付流水 ID 对照 |
| U-08 | 支付收银台 | `pages/payment/cashier` 4 文件、1 个 payment Store | 服务端倒计时、链接/二维码、轮询、前后台恢复完整 | U07 四状态录屏；timer 清理检查 |
| U-09 | 开盒动画 | `components/unbox-animation/` 4 文件、1 个动画状态模块 | 5.10 时间轴、文案、减弱动效和禁关完整 | U08 普通/慢速/降级录屏 |
| U-10 | 开盒流程/结果 | `components/unbox-flow/` 4 文件、1 个 unbox Store | 幂等结果、自动退、恢复和行程跳转完整 | U09 重复进入/断网/无线路用例 |
| U-11 | 行程详情 | `pages/trips/detail` 4 文件、1 个行程 API 调整 | 快照、攻略、日记、打卡和退款失效态完整 | U03 截图；有效/退款两类数据 |
| U-12 | 退款申请 | `pages/refunds/apply` 4 文件、1 个 API 调整 | 可退校验、原因、提交中和重复保护完整 | U10 申请录屏；409 用例 |
| U-13 | 退款详情 | `pages/refunds/detail` 4 文件、1 个 API 调整 | 审核中/通过/驳回/自动退和渠道信息完整 | U10 四状态截图 |
| U-14 | 社区首页 | `pages/community/index` 4 文件、1 个 community Store | 发现/关注/话题/达人、瀑布流和浮动发布完整 | U13/U14 截图；分页去重 |
| U-15 | 帖子详情 | `pages/community/post-detail` 4 文件、1 个互动组件 | 多图/正文/关联卡/评论/赞藏关注分享完整 | U15 长页和键盘录屏 |
| U-16 | 发布页 | `pages/community/publish` 4 文件、1 个上传组件 | 9 图、30/500 字、关联对象、草稿和重试完整 | U16 成功/失败/登录恢复录屏 |
| U-17 | 打卡核心页 | 每次只实现 `pages/checkin` 下一个 4 文件页面 + 1 个组件 | 创建、成功、详情、分享、榜单按页面逐个验收 | U18 分页面截图；归属/重复提交测试 |
| U-18 | 成就核心页 | 每次只实现 `pages/achievements` 下一个 4 文件页面 + 1 个组件 | 列表、详情、四状态和解锁弹层逐个完成 | U19 截图；重复检查测试 |
| U-19 | 现有页面视觉回归 | 每次只处理一个现有页面 4 文件 | 首页/AI/图鉴/行程/我的/登录逐页达到 5.13 | 对应 U01/U03/U05/U11/U12 截图 |
| A-01 | 管理端全局样式和骨架 | `kitchen.css`、`AppLayout.vue`、`Header.vue`、`Sidebar.vue`、`nav.ts` | 6.5 布局、Token、断点和导航一致 | 1440/1280/1024 截图；`npm run build` |
| A-02 | Drawer/Toast/PageHead 基础 | `KitchenDrawer.vue`、`DrawerHost.vue`、`KitchenToast.vue`、`PageHead.vue` | 620px Drawer、详情栈、固定动作和反馈状态完整 | Drawer 多层联查录屏；键盘/焦点检查 |
| A-03 | 社区内容/话题 | `posts.vue`、`topics.vue`、`api/community.ts`、1 个类型文件 | 五状态审核、话题 CRUD、分页/空错/409 完整 | A07；构建和接口契约检查 |
| A-04 | 评论审核 | `comments.vue`、`api/community.ts`、最多 2 个复用组件 | 父子上下文、举报、隐藏/恢复和审计完整 | A08；权限/并发用例 |
| A-05 | 打卡管理 | 单次实现 `checkins/index.vue` 或 `statistics.vue` + API/类型/组件 | 照片、位置、行程、海报、成就和统计完整 | A09；隐私字段检查 |
| A-06 | 成就管理 | 单次实现 `achievements/index.vue` 或 `statistics.vue` + API/类型/组件 | CRUD、四状态预览、解锁率和停用规则完整 | A09；幂等统计检查 |
| A-07 | 现有管理页对照 | 每次只处理 1 个 view、对应 API、最多 3 个组件/类型 | 17 个模块逐页达到 6.2/6.5，不一次改全站 | A01–A15 对应截图；构建 |

任务完成时必须同时提交截图编号、涉及的原型锚点、接口版本和已知差异；只有代码完成但没有对照证据的任务保持未完成状态。

---

## 9. 测试与验收

### 9.1 功能验收

以下能力全部属于 Phase 5 完成条件：

- [ ] 首页、商品广场、商品详情、完整攻略、购物车和“我的”各入口与原型一致，且都有加载/空/错状态。
- [ ] 登录拦截后能返回原页面并恢复加购、支付、发布、收藏或打卡动作。
- [ ] 订单列表/详情、支付记录、15 分钟倒计时、支付宝沙箱链接/二维码、轮询、继续支付、取消和超时恢复可用。
- [ ] 开盒按完整 2700ms 时间轴播放；结果来自服务端幂等结算，动画期间不可重复触发或关闭。
- [ ] 支付成功、无可用线路自动退款、人工退款通过/驳回均能在用户端和管理端显示同一状态。
- [ ] 行程详情、完整攻略、AI 日记、图鉴、人格测试和 AI 搭子完整可用。
- [ ] 社区瀑布流正常展示，支持下拉刷新、上拉加载。
- [ ] 能发布带图片的帖子并选择话题。
- [ ] 帖子详情页关注、点赞、收藏、评论/回复、分享和关联商品跳转正常。
- [ ] 打卡链路完整：拍照 → 上传 → 生成海报 → 分享。
- [ ] 打卡后成就进度更新，解锁弹窗正常显示。
- [ ] 话题广场展示全部话题，点击后可筛选帖子。
- [ ] 达人榜按发帖、打卡、影响力正确排序。
- [ ] 管理端 17 个原型模块都有真实数据、筛选、详情、动作、空错态、权限和必要审计。

### 9.2 后端与安全测试

必须覆盖：

- 未登录写接口返回 401。
- 创建订单重复请求只生成一笔有效订单；支付重复发起/回调不重复记账。
- 客户端倒计时与服务端 `expireAt` 一致，过期订单不能再次支付或开盒。
- 支付链接生成不等于支付成功；`paid` 不等于 `opened`。
- 同一 `orderNo` 重复开盒始终返回同一结果、同一 `tripId`，不重复生成行程/徽章/成就。
- 支付成功后无符合保底线路时只生成一笔自动退款，订单、退款和行程状态一致。
- 人工退款并发通过/驳回只能一个成功；渠道重复回调不重复退款。
- 用户不能读取其他用户的订单、支付记录、退款详情或非公开行程。
- 禁用用户不能发帖、点赞、评论或打卡。
- 用户不能使用其他用户的 `tripId` 创建打卡。
- 用户不能关联其他用户的打卡或行程。
- 用户不能关注自己，重复关注/取消关注不产生重复记录或错误计数。
- 无效/退款行程按冻结规则处理。
- 下架/删除帖子不出现在公开列表、详情、话题计数和榜单。
- 重复点赞/收藏不造成计数漂移。
- 同一用户可以发表多条评论或回复。
- 重复提交打卡不会产生重复记录。
- 成就进度不能由客户端伪造。
- 重复调用成就检查不会重复发放奖励。
- 图片 MIME、扩展名、大小、数量和 URL 校验有效。
- 角色不允许的管理操作返回 403。
- 状态修改和配置修改写入审计日志。
- 分页边界、空数据、异常数据和并发操作正确。

### 9.3 数据库测试

- 空库执行 `schema.sql` 成功。
- 重复初始化/reset 不因新增表已存在失败。
- `seed.sql` 可在初始化后执行。
- seed 按约定可重复执行。
- `checkin.trip_id`、topic 关联、评论唯一性与 API 一致。
- 订单幂等键、支付流水唯一键、开盒结果唯一键和退款单唯一键有效。
- 开盒成功时订单结果、行程快照、徽章/成就事件在事务或可验证补偿机制下保持一致。
- 关键唯一键和应用层归属校验有效。
- 计数与互动明细符合冻结方案。

### 9.4 前端语法和构建

```bash
cd server && mvn test -q
```

```bash
cd admin-web && npm run build
```

```bash
find miniapp -name '*.js' -print0 | xargs -0 -n1 node --check
```

```bash
node -e "JSON.parse(require('fs').readFileSync('miniapp/app.json','utf8')); console.log('app.json ok')"
```

```bash
rg -o '#[0-9A-Fa-f]{6}' miniapp --glob '*.wxss' | sort -u
rg -o '#[0-9A-Fa-f]{6}' admin-web/src --glob '*.css' --glob '*.vue' | sort -u
```

颜色扫描结果逐项归类到 5.12/6.5 Token、支付宝品牌色、图片遮罩或明确的状态色；无法解释的近似色视为视觉缺陷。小程序还必须在微信开发者工具完成全量编译、真机预览和包体积检查，不能以 `node --check` 代替 WXML/WXSS 编译。

使用 Swagger/springdoc 或接口脚本核对：

- 所有 Phase 5 路径、请求体、响应字段；
- 401/403/404/409 错误；
- 分页和排序参数；
- OpenAPI、Controller、前端 API 三者一致。

### 9.5 原型一致性验收

小程序使用 390×844 主视口，并补测 375×812。至少保留以下截图/录屏证据：

| 编号 | 页面/流程 | 必验细节 |
|---|---|---|
| U01 | 首页 | 品牌头、今日特选、搜索、心情/分类、运营位、人气商品、图鉴入口、底栏安全区 |
| U02 | 商品广场/详情 | 五类筛选、商品卡、保底/服务/攻略、加购、立即开盒、下架态 |
| U03 | 完整攻略/行程详情 | 全部攻略区块、模板/快照口径、打卡入口、退款失效提示、AI 日记 |
| U04 | 购物车/我的 | 空态、失效商品、结算规则；资料和订单/行程/图鉴/记录/收藏/打卡/成就入口 |
| U05 | 登录/资料 | 微信/手机号、错误态、资料编辑、退出、登录后恢复原动作 |
| U06 | 订单/支付记录 | 全部筛选、订单详情、支付多流水、继续支付、取消、看行程、申请退款 |
| U07 | 支付收银台 | 15 分钟倒计时、链接/二维码、复制提示、1800ms 轮询、前后台恢复、失败/超时 |
| U08 | 开盒动画 | 盒体/盒盖/路线卡/光线/彩纸/进度、620ms 文案、2700ms 揭晓、禁关、减弱动效 |
| U09 | 结果与异常 | 结果 `.5s` 入场、收下路线、重复进入同结果、无路线自动退款、弱网恢复 |
| U10 | 退款 | 可退校验、原因、审核中、通过、驳回原因、自动退、订单/行程同步 |
| U11 | AI 搭子 | 历史折叠/切换、新会话、快捷问题、推荐卡、输入、失败降级 |
| U12 | 图鉴/人格测试 | 12 徽章、锁定/解锁、5 题进度、四类结果、推荐与重测 |
| U13 | 社区发现 | 四视图栏、分类 Chip、双列瀑布流、浮动发布按钮、底栏不遮挡 |
| U14 | 关注/话题/达人 | 关注空态/有数据、话题数量、达人排行、关注/取消关注 |
| U15 | 帖子详情 | 多图、作者、正文、地点、关联盲盒、评论/回复、点赞、收藏、分享、下架态 |
| U16 | 发布成功/异常 | 9 图、30/500 字、话题/地点/关联；上传失败重试、草稿、登录恢复、审核反馈 |
| U17 | 我的收藏 | 收藏后出现、取消后移除、空态和下架内容处理 |
| U18 | 行程打卡/结果 | 有效行程、图片/位置/备注、重复保护、成功页、海报和分享 |
| U19 | 行为成就 | 锁定/进行中/刚解锁/已解锁、详情、进度和 `newlyUnlocked` 弹窗 |

管理端使用 1440×900 主视口，并补测 1280×800 和 1024×768：

| 编号 | 页面/流程 | 必验细节 |
|---|---|---|
| A01 | 登录与角色 | 五种正式角色、错误态、登录后角色和路由/按钮/API 三层权限 |
| A02 | 工作台/统计 | KPI、待办带筛选跳转、热门盲盒、时间范围、漏斗、分布和口径说明 |
| A03 | 盲盒管理 | 分类/状态/排序、编辑 Drawer、用户端卡片/详情预览、上下架影响 |
| A04 | 线路/攻略 | 线路编辑、随机池与保底校验、攻略完整度、全区块编辑、历史快照不变 |
| A05 | 徽章/运营位 | 12 徽章关联和解锁量；横幅新建/编辑/预览/启停/失效跳转校验 |
| A06 | AI/人格测试 | 配置草稿/发布/回滚、在线预览、5 题/4 结果可达性和版本 |
| A07 | 社区内容 | 五状态、真实分页、详情多图/全文/关联对象、通过/精选/下架/恢复 |
| A08 | 评论审核 | 举报与父子上下文、隐藏/恢复、帖子状态不被隐式改变 |
| A09 | 打卡/成就 | 照片/位置/行程/海报联查；成就 CRUD、四状态预览、达成率和幂等异常 |
| A10 | 订单/支付 | 五状态、订单快照、全部支付尝试、结果/线路/行程联查、禁止手改支付/结果 |
| A11 | 退款审核 | 人工通过/驳回原因、自动退只读、渠道回执、并发处理和审计 |
| A12 | 行程记录 | 有效/退款、订单与攻略快照、分时路线/景点、打卡和攻略管理联查 |
| A13 | 用户档案 | 身份/偏好/资产/成长、内容和交易联查、启禁用确认及用户端阻断 |
| A14 | 系统设置/视觉规范 | 字段范围、版本审计、新订单生效边界；Token 与双端样式映射 |
| A15 | 全局能力 | 订单/退款/用户/帖子/行程搜索，Drawer 返回栈、403、409、空/错/图片失效/Toast |

### 9.6 双端联动验收脚本

至少完整执行一次以下主链路，并记录 `userId/boxId/orderNo/paymentNo/routeId/tripId/checkinId/postId/refundNo/auditId`：

1. 用户登录，从首页进入商品广场和商品详情，加入购物车后发起结算。
2. 服务端创建 `pending_pay` 订单，用户端显示同一个 `orderNo` 和服务端 `expireAt`；管理端订单页可查到该订单。
3. 用户打开支付宝沙箱链接/二维码，返回小程序后轮询到支付成功；支付记录页和管理端展示同一 `paymentNo`、金额和渠道。
4. 用户端请求幂等开盒结果并完整播放 2700ms 动画；动画结束显示服务端返回的路线，重复进入仍是同一结果。
5. 用户收下路线进入行程详情；管理端订单详情、线路攻略和行程详情能以同一 `tripId/routeId` 联查。
6. 用户查看完整攻略和 AI 日记，从本人有效行程完成一次打卡。
7. 打卡成功触发成就检查，用户端展示新解锁或最新进度，管理端出现同一打卡和成就记录。
8. 用户从发布页选择图片、话题、地点，并关联该盲盒/打卡/行程后提交帖子。
9. 管理端工作台待审核数量增加，社区内容列表出现同一 `postId`。
10. 运营打开审核 Drawer，逐级联查盲盒、用户、行程和打卡，审核通过并设为精选。
11. 用户端刷新发现流，帖子可见且精选排序符合规则；第二个用户关注作者、点赞、收藏并评论。
12. 管理端评论审核出现同一评论；隐藏后用户端详情和计数按冻结口径更新。
13. 管理员下架帖子，用户端列表移除，直接深链打开得到明确不可见提示；恢复后重新可见。
14. 原用户对符合规则的已开盒订单申请退款，管理端通过后用户端订单/退款/行程同步为退款/失效状态。
15. 另建一笔无可用保底线路的已支付订单，验证只生成一笔自动退款且不生成有效行程。
16. 审计日志能还原商品/攻略配置、审核/精选/下架、评论处置、退款、用户状态或设置变更的管理员、时间、对象、原因和请求 ID。

### 9.7 视觉回归与“完全对齐”判定

在开始实现前，从两份 HTML 原型固定基线截图并归档：

```text
docs/visual-baselines/phase5/user/U01-U19/
docs/visual-baselines/phase5/admin/A01-A15/
docs/visual-baselines/phase5/diff-log.md
```

每个编号至少包含默认态；涉及交互的页面另存加载、空、错误、选中、禁用、长文本、键盘/Drawer 打开和成功状态。动态图片使用同一测试数据和同一资源 URL，时间、随机数和轮播位置在截图前固定。

| 检查项 | 合格标准 |
|---|---|
| 核心颜色 | CSS/WXSS Token 色值零偏差；不得用肉眼相近色替代 |
| 字体角色 | 衬线/无衬线/手写三类使用位置完全一致；回退字体需单独登记 |
| 主结构尺寸 | 390px 移动基线关键边界偏差 ≤2px；桌面关键边界偏差 ≤4px |
| 间距与圆角 | 同类组件必须使用同一档位；不允许页面自行增加 1–3px 近似值 |
| 图像 | 资源、比例、裁切方向和 `object-fit` 一致；不得用模糊占位图通过验收 |
| 文字 | 文案、行数、截断和对齐一致；允许动态业务值不同但容器不能变形 |
| 状态 | 默认/加载/空/错/禁用/成功均有设计，且不造成布局跳变 |
| 安全区 | iPhone 底部、微信胶囊、键盘、粘底动作和 TabBar 互不遮挡 |
| 响应式 | 375×812、390×844、1024×768、1280×800、1440×900 无重叠和横向页面溢出 |
| 像素差异 | 排除字体抗锯齿和动态内容后，关键区域像素差异目标 <3%；超过必须登记并评审 |
| 动画 | 开盒按 5.10 时间轴逐帧核对；其他过渡保持 180–320ms 且不改变业务时序 |

视觉验收流程：开发者自对照 → 前端交叉检查 → 产品按 U/A 编号确认 → `diff-log.md` 记录“已关闭/接受差异/待修复”。“接受差异”必须写明原因、截图和批准人；没有记录的差异不得以“设备不同”直接关闭。

---

## 10. 阶段交付物

### 文档和契约

- `docs/phase5-详细开发计划.md`
- 更新后的 `docs/openapi.yaml`
- 更新后的 `docs/接口设计.md`
- 更新后的 `docs/数据库设计.md`
- 修订后的 `docs/schema.sql`
- 修订后的 `docs/seed.sql`
- Phase 5 页面/路由、字段、状态机、权限、错误码、可见性和原型差异说明
- `docs/visual-baselines/phase5/` 用户端 U01–U19、管理端 A01–A15 基线和最终截图
- `docs/visual-baselines/phase5/diff-log.md`，记录颜色/字体/尺寸/交互差异及关闭结论
- 双端 Token、字体/资产、px→rpx、组件状态和响应式映射表

### 后端

- 社区、打卡、成就、上传 Controller/Service/Mapper/Entity/DTO/VO。
- 管理端审核、话题、打卡、成就接口。
- 订单/支付/开盒/退款既有接口的幂等、超时、自动退、快照和恢复规则补齐及回归测试。
- 互动幂等、成就进度和奖励状态逻辑。
- 内容审核和审计日志。
- 排行榜、统计、分页和越权测试。

### 小程序

- 首页、商品广场、商品详情、完整攻略、购物车、登录/资料和“我的”完整入口。
- 订单列表/详情、支付记录、支付宝沙箱收银台、支付恢复、退款申请/详情。
- 可复用的开盒流程和完整动画组件、结果页、行程详情及 AI 日记。
- 社区首页、话题、达人榜、发帖、帖子详情。
- 打卡、成功、分享、列表、详情、排行榜。
- 成就列表、详情、进度和解锁弹窗。
- AI 搭子、图鉴、人格测试按原型回归。
- 页面注册、深链/返回栈、API、领域状态模块、图片上传和完整反馈状态。
- 与 5.12 完全一致的颜色、字体、间距、圆角、阴影、图标、TabBar、Sheet 和安全区实现。

### 管理端

- 工作台、数据统计、盲盒、线路/完整攻略、徽章、运营位。
- AI 搭子、人格测试、帖子审核、评论/举报、打卡、话题、成就。
- 订单/支付、退款、行程、用户、系统设置和视觉规范。
- 所有模块的导航、路由、API、Store、分页筛选、详情 Drawer、全局搜索、返回栈、权限和审计操作。
- 与 6.5 完全一致的 228/196px 导航、云朵 Header、高密度表格、620px Drawer、状态组件和响应式断点。

### 验收证据

- U01–U19、A01–A15 原型对照截图/录屏及差异关闭表。
- 390×844、375×812、1440×900、1280×800、1024×768 五档视口截图和像素差异报告。
- 开盒普通速度/慢速/减弱动效/前后台恢复录屏，支付成功/失败/超时/自动退录屏。
- 数据库初始化、重复初始化和 seed 重跑结果。
- API 测试和权限测试报告。
- 全链路 ID 台账、跨用户隔离、交易/互动并发幂等和奖励状态测试结果。
- 已知问题清单和阶段六交接清单。

---

## 11. 阶段完成定义

以下条件全部满足，阶段五才算完成：

- [ ] 用户端原型中的首页、商品、攻略、购物车、订单、支付记录、退款、行程、AI、图鉴、人格测试和“我的”均有对应小程序页面/组件，不存在占位页或死入口。
- [ ] 小程序与管理端核心 Token 色值零偏差，字体角色、组件档位和资源使用符合 5.12/6.5，没有未登记的近似色和重复组件样式。
- [ ] 390/375 移动端及 1440/1280/1024 管理端均无文字、按钮、图片、TabBar、键盘、Sheet 或 Drawer 重叠/截断。
- [ ] 支付倒计时、沙箱链接/二维码、轮询、前后台恢复、继续支付、取消、超时和支付记录全部以服务端状态为准。
- [ ] 开盒完整动画按时间轴验收；结果由服务端幂等产生，重复请求不改变路线或重复生成行程。
- [ ] 支付、开盒、人工退款、自动退款、订单与行程状态在用户端和管理端完全一致。
- [ ] 商品详情、完整攻略、订单详情、退款详情、行程详情、帖子详情等复杂页面支持真实 ID 深链、返回栈和失效态。
- [ ] 社区发现/关注/话题/达人四视图、瀑布流、发帖、图片、详情、点赞、收藏、评论可用。
- [ ] 打卡必须绑定本人有效行程，拍照/上传/海报/分享链路可完成。
- [ ] 打卡后成就进度和解锁状态由服务端真实更新。
- [ ] 话题筛选、达人榜和打卡排行按冻结口径正确排序。
- [ ] 管理端 17 个原型模块全部覆盖列表/面板、筛选、详情 Drawer、状态动作、权限、审计和跨模块联查。
- [ ] 所有写接口完成登录、角色、归属和状态校验。
- [ ] 点赞、收藏、评论、打卡和成就检查具备幂等/并发保护。
- [ ] 图片、GPS、用户生成内容符合安全和隐私规则。
- [ ] schema 可重复初始化，seed 可按约定重跑。
- [ ] `mvn test -q`、`npm run build`、小程序 JS/JSON 检查、微信开发者工具编译/真机预览和包体积检查通过。
- [ ] 原型对照无未关闭的产品级差异。
- [ ] 视觉关键区域像素差异达到 9.7 标准；所有接受差异均有截图、原因和批准记录。
- [ ] U01–U19、A01–A15 和 16 步跨端脚本均有可复核证据。
- [ ] OpenAPI、数据库、前后端实现一致。
- [ ] 没有把阶段六商家、优惠券和积分功能提前混入。

---

## 12. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|---|---:|---:|---|
| 全量原型对齐超出原两周范围 | 高 | 高 | 调整为 20 工作日和四工作流；资源不足拆 5A/5B，不删完成定义 |
| 中文字体缺失导致截图无法对齐 | 高 | 中 | 评估合法子集字体和包体；冻结回退栈；在真机上提前验证而非最后替换 |
| 页面自行写近似色/圆角造成视觉漂移 | 高 | 中 | Token 零偏差、颜色扫描、通用组件唯一实现和差异台账 |
| 全局 WXSS/CSS 改动污染已有页面 | 中 | 高 | 先基线截图；类名加页面/组件前缀；每个任务做全站视觉冒烟 |
| 远程图片失效或裁切不一致 | 中 | 中 | 核心封面本地/受控 CDN、固定比例与 `object-fit`、统一失败占位 |
| 键盘/安全区/长文本造成遮挡 | 高 | 高 | 375/390 真机、长文/长昵称/长订单号、键盘和底部安全区专项验收 |
| 支付轮询/倒计时只靠前端导致状态漂移 | 高 | 高 | `expireAt` 和支付状态以服务端为准；前后台恢复先查询，终态立即停轮询 |
| 重复开盒产生不同路线或重复行程 | 高 | 高 | `orderNo` 唯一结果、事务/补偿、并发与重复请求测试 |
| 动画时序与业务结算耦合 | 中 | 高 | 先取得服务端结果再展示；动画只消费 DTO，动画失败不改交易状态 |
| 无线路时已扣款但未退款 | 中 | 高 | 自动退款补偿、唯一退款单、管理端只读联查和异常告警 |
| 线路模板更新污染历史行程 | 中 | 高 | 订单/行程保存线路与攻略快照，模板和快照使用不同接口 |
| 复杂流程继续堆进单个 overlay | 高 | 中 | 详情/表单迁独立页，弹层只保留短确认；按真实 ID 导航 |
| Phase 5 没有现成 OpenAPI | 高 | 高 | 前两天先契约冻结，禁止前后端各自猜字段 |
| `trip_id` 缺失导致打卡越权 | 高 | 高 | schema 增加 `trip_id`，创建时校验用户、行程、线路和有效性 |
| 评论唯一键阻止重复评论 | 高 | 中 | 独立评论表或调整唯一约束后再实现 |
| 话题自由文本导致计数失真 | 中 | 中 | API 使用 topic ID，服务端维护启用话题和计数 |
| seed 计数与明细不一致 | 高 | 中 | 补齐明细或明确演示快照，不能混用作算法验收数据 |
| schema reset 不完整 | 高 | 高 | 补齐 DROP 顺序并执行空库/重复初始化/seed 重跑测试 |
| 排行榜没有专用模型 | 中 | 中 | 先冻结实时聚合口径；必要时再增加统计缓存，不伪造已有排行表 |
| 海报生成责任不清 | 中 | 中 | 推荐小程序生成海报，明确 `sharePosterUrl` 保存规则 |
| 图片或 GPS 泄露 | 中 | 高 | 服务端校验、位置模糊化、限制公开字段和上传格式 |
| 徽章与成就混用 | 中 | 中 | 保持两套 API、字段、入口和文案独立 |
| 管理端只做前端权限 | 中 | 高 | Service 强制角色校验，写操作记录审计 |
| 阶段范围膨胀到积分商城 | 中 | 中 | 将奖励兑现和积分明确列为阶段六，不在本阶段实现 |

---

## 13. 阶段六交接

### 13.1 奖励兑现

阶段五只维护：

- `achievement.reward_type`
- `achievement.reward_value`
- `user_achievement.reward_sent`

阶段六负责接入：

- `partner`
- `coupon`
- `user_coupon`
- `user_point`
- `point_log`
- 盲盒奖品和商家兑现。

阶段六必须沿用阶段五的解锁幂等机制，不能重复发放奖励。

### 13.2 商家和优惠券

交接内容包括商家入驻、审核、详情、优惠券创建/领取/核销、用户卡包、佣金和商家统计；这些能力不得通过社区或打卡接口隐式实现。

### 13.3 积分

阶段五的打卡、成就事件可作为未来积分来源，但不直接写入积分业务。阶段六需另行冻结：

- 积分余额和账本；
- 签到、打卡、成就、订单的积分规则；
- 退款/取消后的回退；
- 积分兑换和兑换订单；
- 积分与优惠券、奖品的关系。

### 13.4 交接材料

阶段五结束必须提供：

- 冻结后的社区、打卡、成就 OpenAPI；
- `checkin.trip_id`、topic 关联和评论唯一性最终方案；
- 内容审核、公开可见性和禁用用户规则；
- 成就计算、解锁和奖励状态口径；
- 榜单查询口径；
- 审计日志字段；
- seed 演示数据说明；
- 海报、GPS、图片存储、奖励兑现等未完事项清单。

---

*文档版本：v1.3*
*更新时间：2026-09-20*
*负责人：待定*
