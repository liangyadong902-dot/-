# 阶段四实施计划：用户资产与 AI

> 依据：`docs/phase4-详细开发计划.md`、`docs/openapi.yaml`、`docs/schema.sql`、`docs/seed.sql`
> Timebox：13 个工作日
> AI Provider：DeepSeek OpenAI-compatible API
> 默认模型：`deepseek-chat`

> 2026-09-20 执行结果：当前可自动执行项已通过，详见 `docs/acceptance/phase3-4/README.md`。剩余外部检查点为微信开发者工具/真机扫码和支付宝真实沙箱凭据。

## 1. 目标与执行顺序

阶段四交付用户资产、资料编辑、旅行人格、小途 AI、AI 日记，以及管理端用户、统计、AI 配方和人格题库管理。

固定实施顺序：

```text
阶段三准入 -> OpenAPI 冻结 -> 用户资产/人格 -> AI 降级闭环
           -> 模型/Memory/Tool -> AI 日记 -> 管理端 -> 三端验收
```

阶段三真实沙箱支付、notify 幂等、开盒事务和退款统计回落未通过前，只允许准备阶段四页面骨架，不进入正式验收。

## 2. 契约规则

- `docs/openapi.yaml` 是唯一接口契约来源，先改契约再实现。
- 响应统一为 `{ code, message, data }`。
- 分页统一为 `{ list, total, page, pageSize }`。
- 数据库金额使用分，接口展示金额使用元。
- 时间统一为北京时间 `yyyy-MM-dd HH:mm:ss`。
- 用户表状态 `normal` 在 API 层映射为 `active`，不迁移已有数据。
- 游客可用接口支持可选 JWT：无 Token 按游客处理，无效 Token 返回 `401`。

## 3. 用户端接口

### 3.1 用户资料与资产

| 方法 | 路径 | 请求 | 响应 data | 权限 |
|---|---|---|---|---|
| GET | `/api/v1/me` | - | `UserProfile` | 登录 |
| PUT | `/api/v1/me` | `{nickname?,avatarUrl?,gender?,city?}` | `UserProfile` | 登录 |
| GET | `/api/v1/me/stats` | - | `UserStats` | 登录 |
| GET | `/api/v1/me/stats-detail` | - | `UserStats` | 登录 |

`UserStats` 固定字段：

```text
tripCount, savedTotal, title, welfareKm,
badgeUnlocked, badgeTotal, personalityType,
destinations, spendTotal, recentMood,
favoriteCategory, monthTrips, diaryCount
```

统计口径：

- 行程、省钱、目的地、当月出行和日记只统计 `trip.validity='valid'`。
- 消费只统计支付成功且未退款订单。
- 公益里程按有效开盒订单计算，一单一公里。
- 徽章统计读取 `user_badge`，退款不删除、不回落。
- `title`：0-2 次旅行新手，3-7 次探索者，8 次及以上旅行家。
- `PUT /me` 只接受昵称、头像、性别和城市；头像 URL 只接受 HTTPS。

### 3.2 人格测试

| 方法 | 路径 | 请求 | 响应 data | 权限 |
|---|---|---|---|---|
| GET | `/api/v1/personality/questions` | - | `PersonalityQuestion[]` | 游客可用 |
| POST | `/api/v1/personality/submit` | `{answers:number[],durationMs?}` | `PersonalityResult` | 可选登录 |
| GET | `/api/v1/personality/my-result` | - | `PersonalityResult|null` | 登录 |

- `answers` 按启用题目的 `seq` 排序，值为对应选项的零基索引。
- 用户端不返回或提交 `score_json`。
- 后端校验题目数量、题目状态和选项索引，并重新计算四个维度。
- 同分优先级固定为 `nature -> city -> adventure -> culture`。
- 游客只返回结果；登录用户在同一事务内写 `personality_test` 并更新 `app_user`。

### 3.3 小途 AI

| 方法 | 路径 | 请求 | 响应 data | 权限 |
|---|---|---|---|---|
| GET | `/api/v1/ai/config` | - | `{greet,quickQuestions}` | 游客可用 |
| GET | `/api/v1/ai/messages` | `limit=16`，最大 50 | `ChatMessage[]` | 登录 |
| POST | `/api/v1/ai/chat` | `{text,viaQuick=false,sessionId?}` | `AiReply` | 可选登录 |
| GET | `/api/v1/ai/chat/stream` | `text,viaQuick` | SSE | 调试 |

`AiReply`：`{content,fallback,recommendBoxes,sessionId}`。

- 游客首次不传 `sessionId`，服务端生成后返回；后续请求原样回传。
- 登录用户忽略客户端 `sessionId`，固定会话为 `user:{userId}`。
- 文本去空后不能为空，最大 2000 字。
- 小程序正式路径使用整段响应，SSE 不作为阶段验收依赖。

### 3.4 AI 日记

| 方法 | 路径 | 请求 | 响应 data | 权限 |
|---|---|---|---|---|
| POST | `/api/v1/trips/{id}/diary` | - | `{diaryText,fallback}` | 登录 |

- 只能访问本人有效行程。
- 已有日记直接返回，保证幂等。
- 模型输入只使用行程快照。
- 模型失败后使用启用模板；没有模板时使用阶段三固定模板。
- 输出必须包含目的地和亮点，否则按模型失败处理。

## 4. 管理端接口

### 4.1 用户管理

| 方法 | 路径 | 请求/参数 | 响应 |
|---|---|---|---|
| GET | `/api/v1/admin/users` | `keyword,status,channel,page,pageSize` | 用户分页 |
| GET | `/api/v1/admin/users/{id}` | - | 用户完整档案 |
| PATCH | `/api/v1/admin/users/{id}/status` | `{status,reason?}` | `ResultVoid` |
| PATCH | `/api/v1/admin/users/{id}/note` | `{note}` | `ResultVoid` |
| GET | `/api/v1/admin/users/export` | 同列表筛选 | UTF-8 BOM CSV |

- 禁用时 `reason` 必填。
- 用户详情包含资料、统计、人格、心情、徽章、最近订单、行程摘要和客服备注。
- 状态与备注修改必须写 `admin_audit_log`。

### 4.2 管理统计

| 方法 | 路径 | 参数 | 固定返回结构 |
|---|---|---|---|
| GET | `/api/v1/admin/stats/users` | `begin,end` | `users,funnel,titleDistribution,moodDistribution,ai` |
| GET | `/api/v1/admin/stats/pay` | `begin,end` | `orderCount,paidOrderCount,gmv,averageOrderValue,refundCount,refundAmount,refundRate,channels` |
| GET | `/api/v1/admin/stats/content` | `begin,end` | `openCount,boxStats,routeStats` |

缺少埋点的漏斗节点返回 `count:null, rate:null`，不得伪造为零。

### 4.3 AI 配置

| 资源 | 接口 |
|---|---|
| 总配置 | `GET/PUT /api/v1/admin/ai/config` |
| 快捷问题 | `GET/POST /api/v1/admin/ai/quick-questions`，`PUT/DELETE /{id}` |
| 关键词规则 | `GET/POST /api/v1/admin/ai/keyword-rules`，`PUT/DELETE /{id}` |
| 默认回复 | `GET/POST /api/v1/admin/ai/default-replies`，`PUT/DELETE /{id}` |
| 日记模板 | `GET/POST /api/v1/admin/ai/diary-templates`，`PUT/DELETE /{id}` |

总配置字段：`greet`、`systemPrompt`、`diaryPrompt`、`enabled`、`toolsEnabled`、`fallbackEnabled`。接口禁止返回 API Key、base URL 和内部 endpoint。

配置对象：

- 快捷问题：`{id,text,sortWeight,status}`。
- 关键词规则：`{id,keywords[],replyText,recommendBoxIds[],sortWeight,status}`。
- 默认回复：`{id,text,sortWeight,status}`。
- 日记模板：`{id,content,sortWeight,status}`。

### 4.4 人格配置

| 资源 | 接口 |
|---|---|
| 题目 | `GET/POST /api/v1/admin/personality/questions`，`PUT/DELETE /{id}` |
| 选项 | `POST /questions/{questionId}/options`，`PUT/DELETE /options/{id}` |
| 结果 | `GET/POST /api/v1/admin/personality/results`，`PUT/DELETE /{id}` |

- 题目结构：`{id,seq,stem,status,options}`。
- 管理端选项结构：`{id,questionId,seq,label,score}`。
- 已有作答时禁止物理删除题目或选项，返回 `409`，改为下架。
- 已被测试记录引用的结果类型禁止删除。

### 4.5 权限矩阵

| 能力 | 角色 |
|---|---|
| 用户与统计只读 | 全部五种管理角色 |
| 用户禁用、恢复、备注 | `super_admin`、`cs` |
| 用户导出 | `super_admin`、`finance`、`analyst` |
| AI/人格读取 | `super_admin`、`operator`、`cs`、`analyst` |
| AI/人格修改 | `super_admin`、`operator` |

权限由服务层集中校验；前端隐藏按钮不作为安全控制。

## 5. 后端模块拆分

### 5.1 用户资产

- `StatsController`：暴露统计接口。
- `UserStatsService`：统一所有统计口径。
- `UserController/UserService`：资料读取和白名单更新。

### 5.2 人格

- `PersonalityController`：题目、提交、本人结果。
- `PersonalityService`：题库组装、计分、事务落库。
- 增加人格四张表对应的 entity 和 mapper。

### 5.3 AI

- `AiController`：配置、历史、整段聊天。
- `AiConfigService`：Prompt、快捷问题和开关。
- `AiChatService`：上下文组装、模型调用、持久化。
- `AiMemoryService`：Redis 16 条窗口和数据库预热。
- `AiToolService`：盲盒、线路、本人行程和保底规则只读查询。
- `AiFallbackService`：关键词、默认回复和内置短句。
- `AiDiaryService`：日记模型生成、模板降级和幂等更新。

### 5.4 管理端

- `UserAdminController/AdminUserService`：用户档案、状态、备注、导出。
- `StatsAdminController/AdminStatsService`：用户、交易和内容聚合。
- `AiAdminController`：AI 配置 CRUD。
- `PersonalityAdminController`：人格题库 CRUD。
- `AdminAccessService`：服务层角色校验。
- `AdminAuditService`：统一写管理审计日志。

## 6. AI 运行约定

```yaml
ai:
  enabled: true
  provider: deepseek
  base-url: https://api.deepseek.com
  model: deepseek-chat
  timeout-ms: 12000
  memory.window: 16
  tools-enabled: true
  rag-enabled: false
  fallback-enabled: true
```

- API Key 仅存在于被 Git 忽略的 `application-local.yml` 或服务器环境变量。
- 模型超时 12 秒，最多重试一次。
- 降级顺序：最高权重关键词规则 -> 启用默认回复 -> 内置安全短句。
- 登录用户 Redis key：`chat:mem:user:{userId}`。
- 游客 Redis key：`chat:mem:guest:{sessionId}`，TTL 24 小时。
- 上下文顺序：系统约束 -> 用户画像 -> 最近 16 条消息 -> 当前事实。
- 禁止 AI 调用下单、支付、退款、开盒和用户状态修改能力。

## 7. 微信小程序模块

- API 层增加资产详情、资料更新、人格、AI 配置、消息和聊天方法。
- “我的”四宫格读取 `/me/stats`，统计详情读取 `/me/stats-detail`。
- 新增统计详情与资料编辑页面，保留现有头像本地持久化方案。
- 人格测试继续复用 `tuge-overlay`，移除硬编码题目、客户端计分和本地结果。
- AI 页面移除本地模拟成功回复，接入配置、历史、快捷问题、游客 session 和失败重试。
- 行程详情接入日记生成，生成期间锁定按钮，完成后重新加载详情。
- 退出或切换账号时清除当前聊天、历史和游客 session。

## 8. 管理端模块

- 用户页：真实列表、筛选、档案抽屉、禁用/恢复、备注、导出。
- 统计页：今日、7 天、30 天，接入三类统计接口。
- AI 页：总配置、快捷问题、关键词、默认回复、日记模板 CRUD。
- 人格页：题目、选项、计分 JSON、结果定义 CRUD。
- 保存失败保留输入；401 进入登录流程；403 显示无权限。
- 删除所有阶段四页面的 mock 成功数据和“接口待接入”逻辑。

## 9. 13 个工作日排期

| 日期 | 交付 |
|---|---|
| 第 1 天 | 阶段三准入、OpenAPI 补齐、字段与权限冻结 |
| 第 2 天 | 资产统计、资料校验和单元测试 |
| 第 3 天 | 人格查询、计分、持久化和事务测试 |
| 第 4 天 | DeepSeek 依赖、配置、无 Key 启动和降级骨架 |
| 第 5 天 | AI 聊天、消息持久化、关键词/default 降级 |
| 第 6 天 | Redis Memory、历史预热和跨账号隔离 |
| 第 7 天 | 四个只读 Tool 和事实一致性测试 |
| 第 8 天 | AI 日记、模板降级和并发幂等 |
| 第 9 天 | 管理端用户和统计后端/页面 |
| 第 10 天 | AI 配置、人格 CRUD、权限和审计 |
| 第 11 天 | 小程序资产、资料和人格联调 |
| 第 12 天 | 小程序 AI、历史、降级和日记联调 |
| 第 13 天 | 回归、原型对照、安全检查和阶段五交接 |

## 10. 测试与完成标准

```bash
cd server && mvn test -q
cd admin-web && npm run build
find miniapp -name '*.js' -print0 | xargs -0 -n1 node --check
```

必须覆盖：

- 退款后资产、消费和公益里程回落，徽章保留。
- 人格题目不泄漏分数，非法答案拒绝，游客不落库。
- 模型正常、无 Key、超时、异常和无配置五种路径。
- 连续 8 轮对话、16 条窗口、游客过期和跨用户隔离。
- AI 不推荐下架内容、不读取他人行程、不执行交易写操作。
- 日记幂等、并发、越权、无效行程和模板降级。
- 五种管理角色的允许/拒绝路径及审计记录。
- 用户端和管理端加载、空、错误、成功、禁用和 403 状态。
- 仓库、接口、前端产物和普通日志不存在 API Key、完整 Prompt 或模型 endpoint。

## 11. 阶段边界

- 不新增重复的统计、聊天、人格或配置表。
- 不实现向量 RAG、多 Agent 或长期画像自动摘要。
- 不修改阶段三订单状态机、支付入账、退款和开盒事务。
- 不实现 AI 下单、支付、退款或开盒工具。
- 不把社区、打卡、成就、商家和积分功能带入阶段四。
