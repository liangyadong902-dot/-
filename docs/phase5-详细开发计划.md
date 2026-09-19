# 阶段五：社交增强详细开发计划

> 版本：v1.0  
> 阶段：Phase 5  
> Timebox：2 周（14 个工作日，含 1 天缓冲）  
> 用户端形态：原生微信小程序  
> 依据：`docs/开发计划.md` §7、`docs/phase4-详细开发计划.md`、`docs/功能模块设计.md`、`docs/schema.sql`、`docs/seed.sql`、`docs/openapi.yaml`

> **原型还原硬性要求：** 社区、打卡、成就新增页面必须沿用 `docs/页面原型.html` 的视觉 Token、字体、颜色、间距、圆角、阴影、图标、文案风格和交互语言。加载、空数据、错误、登录拦截、详情、弹窗和成功状态都属于验收范围。管理端必须沿用 `docs/管理端页面原型.html`、`docs/管理端页面原型.js` 和现有厨房风格，不能以“接口可用”替代原型对照。

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
- 阶段五联调、原型对照、数据库重置/seed 验证和阶段六交接材料。

---

## 2. 范围与边界

### 2.1 明确包含

| 领域 | 本阶段能力 |
|---|---|
| 社区 | 帖子列表、详情、发布、图片、话题、点赞、收藏、评论、回复、分享计数 |
| 打卡 | 有效行程关联、位置描述、可选 GPS、照片、备注、海报、列表、详情、点赞、排行 |
| 成就 | 打卡/行程/徽章/发帖/消费进度、解锁、用户进度、解锁弹窗、管理配置 |
| 话题 | 话题列表、帖子筛选、管理端 CRUD |
| 排行 | 发帖榜、打卡榜、影响力榜；周/月/总榜 |
| 管理端 | 帖子审核、话题管理、打卡管理与统计、成就管理与达成率 |

### 2.2 明确不做

以下属于阶段六“商家合作与积分”，不得在阶段五隐式加入：

- 商家入驻、商家详情、佣金结算。
- 优惠券创建、发放、核销、用户卡包。
- 积分余额、签到积分、积分商城、积分兑换。
- 盲盒奖品配置和商家奖品兑现。
- 商家统计、合作方运营和结算。

虽然 schema/seed 已预留 `partner`、`coupon`、`user_coupon`、`user_point`、`point_log`，但这些表不代表本阶段获得业务范围。阶段五最多保留成就的 `reward_type`、`reward_value`、`reward_sent` 字段，完整奖励兑现交由阶段六。

本阶段也不做：

- 好友、关注用户、私信、拉黑和通知中心；当前无完整数据模型。
- 修改订单、支付、退款或开盒状态机。
- AI 自动发帖、自动点赞、自动打卡或修改用户资产。
- 完整的地理围栏强校验；GPS 校验作为可选能力，若不实现必须在契约中明确。

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
checkin_like
user_point
point_log
```

本阶段必须补齐 DROP 顺序，验证空库初始化、重复初始化和 seed 重跑。seed 中清理但未填充的互动表要明确是空数据还是补充演示明细。

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
| 社区/打卡/成就只读 | `super_admin`、`operator`、`cs`、`analyst` |
| 帖子下架/恢复 | `super_admin`、`operator`、`cs` |
| 话题写入 | `super_admin`、`operator` |
| 成就配置写入 | `super_admin`、`operator` |
| 统计导出 | `super_admin`、`finance`、`analyst` |

服务端强制校验，前端隐藏按钮不能替代权限控制。帖子审核、话题修改、成就修改和用户内容状态变更必须写入 `admin_audit_log`。

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
│   └── CheckinLike.java
├── domain/mapper/
│   └── 对应 BaseMapper 与聚合 SQL
└── domain/service/
    ├── CommunityService.java
    ├── PostInteractionService.java
    ├── TopicService.java
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

- 公开列表只查询 `status='on'`。
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
- 状态支持 `on/off/deleted`，状态变更必须记录原因和操作人。
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
miniapp/utils/community-store.js
miniapp/utils/checkin-store.js
miniapp/utils/achievement-store.js
```

行为成就和已有线路徽章必须使用不同字段和 API：

- 线路徽章：`state.badges`、`applyRemoteBadges()`。
- 行为成就：`achievements`、`myAchievements`、`newlyUnlocked`。

### 5.2 API 封装

在 `miniapp/services/api.js` 新增：

```javascript
listCommunityPosts
getCommunityPost
createCommunityPost
togglePostLike
togglePostCollect
listPostComments
createPostComment
listTopics
listCommunityLeaders
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

列表和目录默认使用 `{ silent: true }`，发布、点赞、评论、打卡和上传使用正常错误反馈。字段名以冻结后的 OpenAPI 为准。

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

社区三级 Tab 对齐原型：

- 发现
- 话题广场
- 达人榜

原型参考文案和结构：

- `Stories on the road`
- `旅途社区`
- `看见别人的惊喜，也分享你的那一站`
- `docs/页面原型.html` 社区区域

必须实现：

- 双列/瀑布流列表；
- 下拉刷新和上拉加载；
- 按话题筛选；
- 最近/热门排序；
- 帖子空态、加载态和错误重试；
- 未登录发帖/互动登录引导；
- 点赞/收藏乐观更新与失败回滚；
- 详情页评论和回复；
- “抽同款”或关联盲盒跳转行为按原型保留。

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

当前实现为 5 项：首页、AI 搭子、社区、行程、我的；完整计划曾写 6 项并包含图鉴。推荐本阶段保持 5 项，成就从“我的/图鉴”进入，避免同时改动核心导航。

若产品最终要求将图鉴加入 TabBar，必须同步修改：

- `miniapp/app.json`
- `miniapp/custom-tab-bar/index.js`
- `miniapp/custom-tab-bar/index.wxml`
- `miniapp/utils/tuge-store.js`
- 页面顺序、返回行为和原型对照记录。

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

#### 帖子审核

- 关键词、话题、状态、日期筛选。
- 帖子表格：作者、正文摘要、图片、话题、地点、互动数、状态、发布时间。
- 详情 Drawer：完整正文、图片、关联盲盒/打卡/行程、评论摘要。
- `on/off/deleted` 状态操作，操作原因必填或按状态规则处理。
- 处理成功刷新列表并显示 Toast。
- 403、网络错误、空数据和加载态真实展示。

#### 话题管理

- 话题名称、封面、描述、帖子数、关注数、热度/排序、状态。
- 创建、编辑、排序、上下架、删除前引用检查。
- 不允许通过页面保存不存在的 topic ID。

#### 打卡管理与统计

- 按用户、线路、地点、日期筛选。
- 展示照片、备注、位置、点赞数和创建时间。
- 只读详情，不提供未授权修改用户打卡内容。
- 统计总量、今日/本周/本月、地点分布和排行数据。

#### 成就管理与统计

- 成就定义 CRUD：code、名称、描述、图标、类型、阈值、等级、排序、状态。
- 奖励字段只展示已定义结构，不实现阶段六兑现。
- 删除前检查用户进度和引用。
- 统计解锁人数、解锁率和当前进度分布。

### 6.3 导航

在 `admin-web/src/constants/nav.ts` 和 `admin-web/src/router/index.ts` 增加“社区”分组：

```text
社区
- 帖子审核
- 话题管理
- 打卡管理
- 成就管理
```

沿用 `Sidebar.vue` 自动渲染，不另建布局体系。页面标题、图标和路由权限必须与现有管理端一致。

---

## 7. 数据、安全与一致性

### 7.1 内容可见性

公开列表、详情、话题计数和榜单必须过滤：

- `status = off`；
- `status = deleted`；
- 审核中的内容；
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

---

## 8. 两周排期

| 工作日 | 任务 | 交付检查 |
|---|---|---|
| 第 1 天 | 阶段四交接复核；盘点 schema/seed/OpenAPI；决定 `trip_id`、topic、评论唯一性和公开鉴权 | Phase 5 决策清单 |
| 第 2 天 | 更新 OpenAPI、接口说明、数据库设计；修复 schema DROP/reset 和 seed 重跑 | `v5-contract-freeze` |
| 第 3 天 | Entity/Mapper/DTO/VO；打卡归属校验；图片上传基础能力 | 后端结构和上传冒烟 |
| 第 4 天 | 社区列表、详情、话题查询、发帖 | 社区只读与发帖接口可用 |
| 第 5 天 | 小程序社区首页、PostCard、分页、刷新、发布入口 | 社区发现页可展示真实 seed |
| 第 6 天 | 点赞、收藏、评论/回复及并发幂等 | 互动计数不漂移 |
| 第 7 天 | 行程打卡入口、checkin-info、创建打卡、图片/备注 | 本人有效行程可完成打卡 |
| 第 8 天 | 打卡列表、详情、点赞、海报和分享页 | 打卡闭环可录屏 |
| 第 9 天 | 成就进度计算、解锁、我的成就、解锁弹窗 | 重复检查不重复解锁 |
| 第 10 天 | 话题广场、达人榜、打卡排行 | 周/月/总榜排序正确 |
| 第 11 天 | 管理端帖子审核、话题管理、路由导航 | 管理端可审核/下架 |
| 第 12 天 | 管理端打卡统计、成就 CRUD/统计、审计 | 角色 403 和审计有效 |
| 第 13 天 | 三端联调、跨用户越权、分页、seed 和初始化回归 | 关键问题关闭 |
| 第 14 天 | 原型对照、验收材料、已知问题和阶段六交接 | 阶段五验收包归档 |

### 8.1 分工建议

| 角色 | 负责内容 |
|---|---|
| 后端 A | 契约、schema、社区/打卡/成就服务、上传、权限、审计和测试 |
| 前端 B | 小程序社区、发布、互动、打卡、成就、原型对照 |
| 前端 C | 管理端帖子/话题/打卡/成就页面、API、权限联调 |

并行原则：第 1–2 天只冻结契约和数据库；第 3 天后前后端基于冻结字段并行。上传存储、`trip_id` 归属和权限不能拖到最后联调。

---

## 9. 测试与验收

### 9.1 功能验收

必须满足总计划的九项验收：

- [ ] 社区瀑布流正常展示，支持下拉刷新、上拉加载。
- [ ] 能发布带图片的帖子并选择话题。
- [ ] 帖子详情页点赞、评论正常。
- [ ] 打卡链路完整：拍照 → 上传 → 生成海报 → 分享。
- [ ] 打卡后成就进度更新，解锁弹窗正常显示。
- [ ] 话题广场展示全部话题，点击后可筛选帖子。
- [ ] 达人榜按发帖、打卡、影响力正确排序。
- [ ] 管理端可以审核帖子、下架内容。
- [ ] 管理端可查看打卡统计和成就达成率。

### 9.2 后端与安全测试

必须覆盖：

- 未登录写接口返回 401。
- 禁用用户不能发帖、点赞、评论或打卡。
- 用户不能使用其他用户的 `tripId` 创建打卡。
- 用户不能关联其他用户的打卡或行程。
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

使用 Swagger/springdoc 或接口脚本核对：

- 所有 Phase 5 路径、请求体、响应字段；
- 401/403/404/409 错误；
- 分页和排序参数；
- OpenAPI、Controller、前端 API 三者一致。

### 9.5 原型一致性验收

小程序固定 375px 或 390×844 视口，至少截图/录屏：

- 社区发现、刷新、空态、错误态；
- 话题筛选和达人榜；
- 带图发帖、上传失败和发布成功；
- 帖子详情点赞、收藏、评论和回复；
- 行程进入打卡、上传、成功页、海报和分享；
- 成就列表、进度、详情和解锁弹窗；
- 登录拦截、网络错误和重复提交。

管理端固定桌面视口，至少覆盖：

- 帖子审核列表和详情抽屉；
- 话题 CRUD；
- 打卡列表和统计；
- 成就配置和达成率；
- 加载、空数据、403、校验失败和成功 Toast。

---

## 10. 阶段交付物

### 文档和契约

- `docs/phase5-详细开发计划.md`
- 更新后的 `docs/openapi.yaml`
- 更新后的 `docs/接口设计.md`
- 更新后的 `docs/数据库设计.md`
- 修订后的 `docs/schema.sql`
- 修订后的 `docs/seed.sql`
- Phase 5 字段、状态、权限、错误码和可见性说明

### 后端

- 社区、打卡、成就、上传 Controller/Service/Mapper/Entity/DTO/VO。
- 管理端审核、话题、打卡、成就接口。
- 互动幂等、成就进度和奖励状态逻辑。
- 内容审核和审计日志。
- 排行榜、统计、分页和越权测试。

### 小程序

- 社区首页、话题、达人榜、发帖、帖子详情。
- 打卡、成功、分享、列表、详情、排行榜。
- 成就列表、详情、进度和解锁弹窗。
- API、领域状态模块、图片上传和完整反馈状态。

### 管理端

- 帖子审核。
- 话题管理。
- 打卡管理和统计。
- 成就管理和统计。
- 导航、路由、API、Store、权限和审计操作。

### 验收证据

- 九项功能验收截图或录屏。
- 数据库初始化、重复初始化和 seed 重跑结果。
- API 测试和权限测试报告。
- 跨用户隔离、并发幂等和奖励状态测试结果。
- 已知问题清单和阶段六交接清单。

---

## 11. 阶段完成定义

以下条件全部满足，阶段五才算完成：

- [ ] 社区瀑布流、发帖、图片、话题、详情、点赞、收藏、评论可用。
- [ ] 打卡必须绑定本人有效行程，拍照/上传/海报/分享链路可完成。
- [ ] 打卡后成就进度和解锁状态由服务端真实更新。
- [ ] 话题筛选、达人榜和打卡排行按冻结口径正确排序。
- [ ] 管理端可以审核/下架帖子，查看打卡统计和成就达成率。
- [ ] 所有写接口完成登录、角色、归属和状态校验。
- [ ] 点赞、收藏、评论、打卡和成就检查具备幂等/并发保护。
- [ ] 图片、GPS、用户生成内容符合安全和隐私规则。
- [ ] schema 可重复初始化，seed 可按约定重跑。
- [ ] `mvn test -q`、`npm run build`、小程序 JS 语法检查通过。
- [ ] 原型对照无未关闭的产品级差异。
- [ ] OpenAPI、数据库、前后端实现一致。
- [ ] 没有把阶段六商家、优惠券和积分功能提前混入。

---

## 12. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|---|---:|---:|---|
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

*文档版本：v1.0*  
*更新时间：2026-09-19*  
*负责人：待定*
