# 阶段四：用户资产与 AI 详细开发计划

> 版本：v1.0  
> 阶段：Phase 4  
> Timebox：2.5 周（13 个工作日，含 1 天缓冲）  
> 用户端形态：原生微信小程序  
> 依据：`docs/phase3-详细开发计划.md`、`docs/开发计划.md` §6、`docs/功能模块设计.md`、`docs/AI智能体设计.md`、`docs/openapi.yaml`、`docs/schema.sql`、`docs/seed.sql`

> **原型还原硬性要求：** 本阶段不改变阶段三已经完成的用户端和管理端视觉体系。所有新增页面、弹层、加载态、空态、错误态、结果态和交互必须继续以 `docs/页面原型.html`、`docs/管理端页面原型.html` 与 `docs/管理端页面原型.js` 为基准，沿用现有 Token、组件、文案风格和动效。功能可用但存在未确认的视觉偏差，不得标记为阶段完成。

---

## 1. 阶段目标与边界

### 1.1 核心目标

把阶段三已经产生的交易资产转化为用户可持续使用的产品能力：

```text
有效行程 / 订单 / 徽章 / 心情
            │
            ├── 我的统计与资产详情
            ├── 旅行人格画像
            ├── 小途 AI 旅行搭子
            └── AI 旅行日记
```

本阶段完成后，用户可以查看真实资产、完成旅行人格测试、与小途连续对话、获得基于当前内容数据的推荐，并生成包含本人行程事实的旅行日记。模型不可用时，核心流程仍通过关键词和模板降级正常工作。

### 1.2 本阶段交付

- 「我的」统计详情：出行、目的地、徽章、消费、省钱、公益里程、月度数据、日记数量等真实口径。
- 用户资料编辑：昵称、头像、性别、城市；沿用阶段三登录和头像临时文件处理方案。
- 旅行人格测试：题目、选项、服务端计分、结果落库、重测和结果查询。
- 小途 AI：开场白、快捷问题、整段对话、最近消息、连续上下文、用户画像注入、事实查询工具、关键词降级。
- AI 旅行日记：模型生成优先，模板日记作为稳定降级；行程事实只能来自服务端快照。
- 管理端用户管理：列表、筛选、详情、资产摘要、禁用/恢复、备注和导出。
- 管理端统计：核心交易、用户、心情和 AI 使用数据的真实读取。
- 管理端 AI 配方：系统 Prompt、开场白、快捷问题、关键词规则、默认回复、日记 Prompt/模板。
- 管理端人格测试配置：题目、选项、计分配置、人格结果定义。
- 阶段四联调记录、原型对照记录、测试报告、已知问题和阶段五交接清单。

### 1.3 明确不做

- 不修改阶段三订单状态机、支付入账规则、notify 语义和开盒事务。
- 不新增自动支付、自动退款或自动开盒的 AI Tool。
- 不实现多 Agent 编排；小途保持单一旅行顾问 Agent。
- 不在第一期引入完整向量 RAG；先用 MyBatis 查询和只读 Tool 实现事实召回。
- 不实现自动生成长期画像摘要；`user_ai_memory` 只保留结构和后续扩展位置。
- 不实现社区、打卡、成就、商家、优惠券、积分商城。
- 不把模型 Key、系统 Prompt 或业务规则放到小程序端。
- 不以本地缓存冒充服务端的统计、人格、聊天历史或行程状态。

### 1.4 阶段三交接前置条件

以下条件全部满足后才能进入本阶段开发：

- [ ] 阶段三沙箱真付款路径至少成功一次。
- [ ] 支付宝 notify 验签、金额校验和幂等处理已验收。
- [ ] 支付成功后订单、行程、徽章在同一事务内一致。
- [ ] 退款后行程 `validity=invalid`，徽章保留，`/me/stats` 口径正确回落。
- [ ] 模板日记接口可用，能包含目的地和亮点。
- [ ] `docs/openapi.yaml` 与阶段三实现路径已冻结。
- [ ] MySQL、Redis 均有可用的本地或测试环境。
- [ ] AI Key 通过环境变量或未提交的本地配置提供，禁止写入仓库。

---

## 2. 数据与接口约定

### 2.1 单一契约来源

`docs/openapi.yaml` 是阶段四接口的唯一契约来源。所有新增或修改必须遵循：

1. 先修改 OpenAPI，再实现 Controller、Service 和前端调用。
2. 统一使用 `{ code, message, data }` 响应体。
3. 列表使用 `{ list, total, page, pageSize }`，配置型小列表可按既有契约返回数组。
4. 接口时间使用北京时间字符串 `yyyy-MM-dd HH:mm:ss`。
5. 数据库金额使用分，接口展示金额使用元；转换只放在 DTO/VO/Assembler。
6. 禁止为了迁就实现而修改原型文案和交互流程。

阶段四开发第 1 天完成 `v4-contract-freeze` 检查，并把差异登记在 `docs/phase4-week*-联调记录.md` 中。

### 2.2 复用现有数据表

本阶段优先复用 `docs/schema.sql` 已有表，不重复创建业务模型：

| 能力 | 复用表 |
|---|---|
| 用户资料与画像 | `app_user` |
| 统计与资产 | `trip`、`biz_order`、`user_badge`、`badge`、`mood_log` |
| AI 对话 | `chat_message`、Redis 短期记忆 |
| AI 画像扩展 | `user_ai_memory`（本阶段不强制自动摘要） |
| AI 降级 | `ai_keyword_rule`、`ai_default_reply` |
| AI 配置 | `ai_quick_question`、`diary_template`、`sys_config` |
| 人格测试 | `personality_question`、`personality_option`、`personality_result`、`personality_test` |
| 管理端审计 | `admin_audit_log` |

若发现确实缺少字段，只允许提交向后兼容的迁移，必须同时更新 `schema.sql`、`seed.sql`、OpenAPI 和回滚说明。不允许新建与上述表重复的“统计表”“聊天表”或“人格表”。

### 2.3 阶段四接口清单

#### 用户端资产和资料

| 方法 | 路径 | 登录 | 说明 |
|---|---|---:|---|
| GET | `/api/v1/me` | 是 | 当前用户资料，复用阶段三接口 |
| PUT | `/api/v1/me` | 是 | 更新昵称、头像、性别、城市 |
| GET | `/api/v1/me/stats` | 是 | 阶段三已冻结的核心四宫格统计 |
| GET | `/api/v1/me/stats-detail` | 是 | 完整资产详情、人格和偏好 |

#### 人格测试

| 方法 | 路径 | 登录 | 说明 |
|---|---|---:|---|
| GET | `/api/v1/personality/questions` | 否 | 返回题干和选项，不返回 `score_json` |
| POST | `/api/v1/personality/submit` | 否 | 服务端计分；登录用户落库 |
| GET | `/api/v1/personality/my-result` | 是 | 返回当前用户最近一次结果 |

#### 小途 AI

| 方法 | 路径 | 登录 | 说明 |
|---|---|---:|---|
| GET | `/api/v1/ai/config` | 否 | 开场白和快捷问题 |
| GET | `/api/v1/ai/messages` | 是 | 返回最近 16 条登录用户消息 |
| POST | `/api/v1/ai/chat` | 否 | 小程序主路径，整段响应 |
| GET | `/api/v1/ai/chat/stream` | 视实现 | 仅供 H5/调试，非小程序依赖 |

#### 管理端

| 模块 | 路径范围 |
|---|---|
| 用户 | `/api/v1/admin/users`、`/{id}`、`/{id}/status`、`/export` |
| 统计 | `/api/v1/admin/stats/users`、`/stats/pay`、`/stats/content` |
| AI 配置 | `/api/v1/admin/ai/config`、`quick-questions`、`keyword-rules`、`default-replies`、`diary-templates` |
| 人格配置 | `/api/v1/admin/personality/questions`、`options`、`results` |

### 2.4 权限矩阵

| 动作 | 允许角色 |
|---|---|
| 用户/统计只读 | `super_admin`、`operator`、`cs`、`finance`、`analyst` |
| 用户禁用/恢复、备注 | `super_admin`、`cs` |
| AI/人格配置读写 | `super_admin`、`operator` |
| AI/人格配置只读 | `cs`、`analyst` |
| 统计导出 | `super_admin`、`finance`、`analyst` |
| 用户导出 | `super_admin`、`finance`、`analyst` |

权限必须由服务端校验，前端隐藏按钮只能改善体验，不能作为安全控制。所有禁用用户、修改配置和人格题库的操作写入 `admin_audit_log`。

---

## 3. 后端详细开发计划

继续沿用现有 `controller / service / mapper / entity / dto / vo` 分层，禁止把阶段四逻辑全部堆入 `UserService` 或 `TripService`。

### 3.1 用户资产与统计

新增或拆分：

```text
server/src/main/java/com/tuge/
├── controller/
│   ├── StatsController.java
│   ├── PersonalityController.java
│   └── AiController.java
├── controller/admin/
│   ├── UserAdminController.java
│   ├── StatsAdminController.java
│   ├── AiAdminController.java
│   └── PersonalityAdminController.java
└── domain/service/
    ├── UserStatsService.java
    ├── PersonalityService.java
    ├── AiConfigService.java
    ├── AiChatService.java
    ├── AiFallbackService.java
    ├── AiMemoryService.java
    ├── AiToolService.java
    ├── AiDiaryService.java
    └── AdminUserService.java
```

`UserStatsService` 的口径固定如下：

| 字段 | 统计口径 |
|---|---|
| `tripCount` | `trip.validity='valid'` 的行程数 |
| `savedAmount` | 有效行程 `value_cent - price_cent` 之和，接口元 |
| `levelNo` | `max(1, tripCount)`，除非阶段三已冻结其他等级规则 |
| `title` | 0–2「旅行新手」、3–7「探索者」、≥8「旅行家」 |
| `welfareMiles` | 有效开盒订单数，1 单计 1 里程 |
| `badgeCount` | 当前用户 `user_badge` 数量，退款不删除 |
| `badgeTotal` | `badge` 定义总数 |
| `totalPaid` | 有效订单实付金额 |
| `destinationCount` | 有效行程目的地去重数 |
| `monthTripCount` | 当月有效行程数 |
| `diaryCount` | `diary_text` 非空的有效行程数 |
| `lastMood` | 用户最近一次有效心情记录 |
| `favCategory` | 有效行程中出现次数最多的盲盒分类，可空 |
| `personalityType` | `app_user.personality_type`，可空 |

要求：

- 所有统计 SQL 明确写出 `validity='valid'` 或有效订单条件，不依赖前端过滤。
- 退款后重新请求统计必须立即回落，不使用过期缓存冒充结果。
- 统计服务只读，不反向修改订单、行程或徽章。
- 复杂聚合可按用户 ID 分组查询，先保证口径正确，再做缓存优化。

### 3.2 用户资料

扩展现有 `UserController`/`UserService`：

- `PUT /me` 只允许更新昵称、头像、性别、城市。
- 昵称长度、头像 URL 协议和字段长度进行服务端校验。
- 头像只接受 `https`；拒绝 `http://tmp`、`wxfile://` 和任意本地路径。
- 禁用用户访问所有登录接口返回 `403`。
- 更新资料后返回最新 `UserVO`，不让客户端依靠旧缓存合并结果。
- 不修改 `register_channel`、`status`、`personality_type` 等服务端字段。

### 3.3 人格测试

`PersonalityService` 实现以下流程：

1. 查询 `personality_question`，按 `seq` 排序，仅返回启用题目。
2. 查询对应 `personality_option`，按题目和选项序号排序。
3. 组装给前端的 DTO 时剔除 `score_json`。
4. 提交时校验题目数量、题目顺序、选项存在性、选项归属和重复答案。
5. 服务端解析每个选项的 `score_json`，按维度求和。
6. 按固定规则确定 `personality_result.type`；同分时使用文档规定的稳定优先级，不能依赖数据库返回顺序。
7. 游客只返回人格结果，不写 `personality_test`。
8. 登录用户写入 `personality_test`，并更新 `app_user.personality_type/personality_at`。
9. `my-result` 只返回当前用户的数据，不能通过参数读取他人结果。

提交失败不能部分更新用户画像；人格记录和 `app_user` 更新放在一个事务中。

### 3.4 AI 配置与模型接入

#### 配置

在 `server/pom.xml` 增加与 Spring Boot 3.2 兼容的 Spring AI OpenAI-compatible starter；版本先在第 1 天锁定并记录。新增配置项：

```yaml
ai:
  enabled: ${AI_ENABLED:true}
  provider: ${AI_PROVIDER:}
  base-url: ${AI_BASE_URL:}
  model: ${AI_MODEL:}
  api-key: ${AI_API_KEY:}
  timeout-ms: ${AI_TIMEOUT_MS:12000}
  memory:
    window: ${AI_MEMORY_WINDOW:16}
  tools-enabled: ${AI_TOOLS_ENABLED:true}
  rag-enabled: ${AI_RAG_ENABLED:false}
  fallback-enabled: ${AI_FALLBACK_ENABLED:true}
```

约束：

- `AI_API_KEY` 不能进入 Git、数据库、OpenAPI 响应、管理端页面或日志。
- 没有 Key 或 `ai.enabled=false` 时，服务必须直接走降级，不得启动失败。
- 模型超时 12 秒，最多重试 1 次；失败后进入降级路径。
- 模型原始异常只记服务端日志，不直接返回用户。

#### 单 Agent 结构

使用一个小途 `ChatClient`，按以下顺序组装上下文：

1. 人设和安全约束：自称小途，不虚构价格，不承诺必中特定线路。
2. 用户画像：昵称、称号、有效出行数、最近心情、人格、最近 3 条有效行程、待支付订单数。
3. Redis 短期记忆：最近 16 条消息。
4. 当前事实召回：上架盲盒、启用线路和保底规则。
5. 输出和日志：控制长度、记录耗时与 token 用量。

不做 Planner、Researcher、Writer 多 Agent，也不允许 AI 直接调用订单变更、支付、退款、开盒接口。

### 3.5 AI Memory 与聊天持久化

- 登录用户 Redis key：`chat:mem:user:{userId}`。
- 游客 Redis key：`chat:mem:guest:{sessionId}`，设置过期时间，不写 `chat_message`。
- 进入 AI 页面时，从 `chat_message` 预热最近 16 条。
- 登录用户每次发送和回复分别写一条 `chat_message`。
- 正确记录 `conversation_id`、`via_quick`、`fallback`、`token_in`、`token_out`。
- 超过 16 条只保留最近窗口；本阶段不做自动长期摘要。
- `GET /ai/messages` 默认返回最近 16 条，最多允许客户端请求 50 条。
- 用户注销或更换账号时清理前端当前会话，不能串用上一用户的消息。

### 3.6 AI 只读工具

实现为服务层只读能力，必要时再注册为 Spring AI Tool：

| Tool | 入参 | 数据来源 | 约束 |
|---|---|---|---|
| `recommendBoxes` | mood、category | `blind_box`、心情关联表 | 只返回 `status='on'` |
| `searchRoutes` | keyword、category | `travel_route` | 只返回 `status='on'` |
| `getMyTrips` | 当前用户 | `trip` | 只返回本人有效行程 |
| `getValueGuard` | 无 | 系统配置和退款规则 | 只读说明，不创建退款 |

Tool 返回的数据必须作为事实来源：盲盒名称、价格、保底、线路名称和目的地不能由模型自由编造。游客调用 `getMyTrips` 时返回未登录提示，不查询任何用户数据。

### 3.7 降级回复

`AiFallbackService` 执行顺序：

1. 将用户输入与启用的 `ai_keyword_rule` 关键词匹配，按 `sort_weight` 从高到低选择。
2. 若命中，返回规则回复和可选推荐盲盒；推荐盲盒仍需二次校验当前为上架状态。
3. 未命中时从 `ai_default_reply` 选择启用的默认回复。
4. 没有配置时返回内置安全短句。
5. 响应 `fallback=true`，前端可展示正常 AI 气泡，不暴露内部错误。

模型不可用不能阻塞用户查看行程、订单和统计；降级回复不能执行任何副作用操作。

### 3.8 AI 旅行日记

将阶段三 `TripService.diary` 中的固定文本生成逻辑拆到 `AiDiaryService`：

- 先按用户 ID 和行程 ID查询，确保只能访问本人行程。
- `diary_text` 已存在时直接返回，保证幂等。
- 输入只使用行程快照：线路名、目的地、亮点、情绪文案、购入价和票面价值。
- 模型生成成功后写入 `trip.diary_text` 和 `diary_at`。
- 模型异常、无 Key 或超时后使用 `diary_template`；没有模板时使用阶段三固定模板。
- 生成内容必须包含目的地和亮点，不能编造未在快照中的景点、价格或服务。
- 无效行程默认不能生成新日记；已有日记是否可读遵循阶段三行程详情约定。
- 使用事务或条件更新防止并发请求覆盖已生成内容。

### 3.9 管理端后端

补齐以下服务能力：

- 用户分页：按昵称、手机号、注册渠道、状态、时间筛选。
- 用户详情：资料、统计摘要、人格结果、最近心情、订单/行程摘要、AI 活跃时间。
- 用户状态：禁用、恢复、客服备注；禁用原因必填并写审计日志。
- 用户导出：按角色校验，手机号按导出规范脱敏或完整展示。
- AI 配置 CRUD：系统 Prompt、开场白、模型开关、快捷问题、关键词、默认回复、日记模板。
- 人格题库 CRUD：题目、选项、计分 JSON、人格结果定义；删除前检查引用。
- 统计接口：今日/近 7 天/近 30 天，返回真实数据和空数据状态。

---

## 4. 微信小程序详细开发计划

### 4.1 API 层

扩展 `miniapp/services/api.js`，统一复用 `utils/request.js` 和 `utils/auth.js`：

```javascript
getStatsDetail: () => request.get('/me/stats-detail'),
updateMe: (data) => request.put('/me', data),
listPersonalityQuestions: () => request.get('/personality/questions'),
submitPersonality: (data) => request.post('/personality/submit', data),
myPersonality: () => request.get('/personality/my-result'),
aiConfig: () => request.get('/ai/config', undefined, { silent: true }),
aiMessages: (params) => request.get('/ai/messages', params, { silent: true }),
aiChat: (data) => request.post('/ai/chat', data),
```

具体字段以 `docs/openapi.yaml` 最终冻结版本为准，不能自行在前端猜测字段。

### 4.2 「我的」页面与资产详情

- 保留阶段三的头部、头像圈、四宫格、订单入口、服务说明和退出交互。
- 四宫格真实读取 `/me/stats`，不能继续使用固定演示数字。
- 新增统计详情入口，展示目的地数、当月出行、徽章进度、累计消费、日记数、最近心情、人格结果等。
- 新增资料编辑页面/弹层，保存成功后刷新 `/me` 和头像显示。
- 头像沿用阶段三的临时文件落盘、下载和恢复逻辑；服务端返回空头像时不覆盖本地可用头像。
- 未登录访问资产详情时先显示原型登录弹层，不进入半成品页面。
- 网络错误、禁用用户、空统计和保存失败均有原型一致的反馈。

建议文件：

```text
miniapp/pages/mine/index.*
miniapp/pages/mine/stats-detail.*
miniapp/pages/mine/edit-profile.*
miniapp/pages/mine/about.*
miniapp/components/stats-grid/*
```

### 4.3 人格测试

- 题目和选项必须由接口动态渲染，不能把五题长期硬编码在页面逻辑中。
- 每题单选，显示当前题号和进度；不能跳过必答题。
- 记录开始时间和提交耗时 `durationMs`。
- 提交时仅发送题目/选项标识或契约规定的答案序号，不能发送或依赖客户端 `score_json`。
- 结果页展示类型、名称、印记、描述和推荐方向。
- 支持重测；重新进入时优先读取服务端结果。
- 游客可以完成测试并查看结果，但登录后才持久化。
- 题目为空、提交失败、登录过期和重复点击均有明确处理。

### 4.4 小途 AI 页面

继续复用 `miniapp/pages/ai`、`utils/tuge-store.js` 的页面订阅机制，但移除真实成功路径中的本地假回复：

1. 页面进入时请求 AI 配置。
2. 登录用户同时请求最近消息并恢复当前会话。
3. 游客显示开场白和快捷问题；游客消息不写服务端历史。
4. 发送消息前校验非空、长度和当前 `aiBusy` 状态。
5. 用户气泡立即显示，调用 `POST /ai/chat`。
6. 收到整段响应后通过 `utils/typewriter.js` 打字展示 AI 气泡。
7. 快捷问题请求设置 `viaQuick=true`。
8. `fallback=true` 时继续正常展示回复，可提供轻量“稍后再试”提示但不能暴露异常。
9. 页面重新进入时以服务端历史为准；切换账号必须清除旧会话。
10. 支持新对话、空态、网络错误和重试。

模型事实约束在后端执行；前端不实现推荐价格计算、不拼接系统 Prompt、不保存 Key。

### 4.5 AI 日记交互

- 行程详情保留现有“生成日记”按钮和生成中状态。
- 生成中禁用重复点击，显示原型规定的加载文案。
- 成功后刷新当前行程详情并展示日记内容。
- 降级模板成功也要显示内容，不把 `fallback` 当成失败。
- 真实失败时保留已有日记，不清空页面。
- 日记生成后回到行程列表，列表状态与详情一致。

### 4.6 小程序原型对照状态

固定 375px 或 390×844 视口，至少记录以下截图：

- 我的：游客、登录、统计详情、编辑资料、保存失败。
- 人格：开始、答题中、最后一题、结果、重测、题库为空。
- AI：首屏、快捷问题、连续对话、历史恢复、降级、网络错误、空输入。
- 行程日记：未生成、生成中、生成成功、模型降级、已存在日记。

---

## 5. 管理端详细开发计划

管理端继续复用阶段一布局、Axios 拦截器、`useTable`、`PageHead`、厨房风格组件和角色状态。禁止成功态继续显示本地 mock 数据。

### 5.1 用户管理 `views/users/index.vue`

实现：

- 分页列表：ID、昵称/微信名、注册渠道、出行次数、称号、累计消费、省钱、最近活跃。
- 筛选：昵称/手机号/ID、渠道、状态、注册时间、最近活跃时间。
- 用户档案抽屉：资料、统计、人格、最近心情、最近订单、有效/失效行程、AI 活跃摘要。
- 禁用/恢复：禁用必须填写原因；恢复需要二次确认。
- 客服备注：服务端保存并记录操作人。
- 导出按钮按角色显示；后端再次校验权限。
- 加载、空数据、接口错误、403 和成功状态均使用真实状态，不用静态“接口待接入”替代。

### 5.2 数据统计 `views/stats/index.vue`

接入 `/api/v1/admin/stats/*`，支持今日、近 7 天、近 30 天：

- 开盒量、成交额、客单价、退款率、新增用户。
- 访问、选心情、浏览盲盒、点击开盒、创单、支付、开盒完成漏斗；无法提供的指标明确显示“暂无数据”，不伪造 0。
- 称号分布。
- 心情分布。
- AI 对话人数、消息数、fallback 比例（如契约提供）。
- 切换时间范围后重新请求，不在前端按当前页数据自行计算全局指标。

### 5.3 AI 配置 `views/ai/index.vue`

将现有“写入接口在阶段二接入”占位替换为真实接口：

- 开场白和系统 Prompt。
- 日记 Prompt/模板。
- 快捷问题新增、编辑、排序、上下架、删除。
- 关键词规则及回复。
- 默认回复。
- AI 开关、工具开关和降级开关（若服务端契约开放）。
- 保存成功后重新拉取配置，失败保留用户编辑内容并提示原因。
- 不显示 API Key、模型私密配置或内部异常堆栈。

### 5.4 人格测试 `views/quiz/index.vue`

- 题目列表：序号、题干、状态、更新时间。
- 题目编辑：题干、上下架、排序。
- 选项编辑：文案、序号、计分维度 JSON；输入格式校验。
- 人格结果编辑：类型、名称、印记、描述、推荐方向。
- 删除/下架前检查是否已有作答记录或被结果引用。
- 保存后刷新列表，服务端错误不能被静默吞掉。

### 5.5 类型、API 和路由

补充：

```text
admin-web/src/api/user.ts
admin-web/src/api/stats.ts
admin-web/src/api/ai.ts
admin-web/src/api/personality.ts
admin-web/src/types/index.ts
admin-web/src/views/users/index.vue
admin-web/src/views/stats/index.vue
admin-web/src/views/ai/index.vue
admin-web/src/views/quiz/index.vue
```

复用现有 `api/index.ts` 的 401 处理、`toast` 和 `useTable`，不建立第二套请求客户端。

---

## 6. 13 个工作日排期

| 工作日 | 任务 | 当日验收 |
|---|---|---|
| 第 1 天 | 阶段三门槛复核；OpenAPI、schema、seed 检查；AI 配置与 Redis 检查；冻结权限矩阵 | `v4-contract-freeze` 清单完成 |
| 第 2 天 | `/me/stats-detail`、资料编辑、人格题库读取与提交接口 | 统计和人格单测启动 |
| 第 3 天 | 人格结果持久化、`my-result`、用户统计边界测试 | 登录/游客人格路径可用 |
| 第 4 天 | Spring AI 依赖、ChatClient、AI 配置读取、模型关闭时启动 | 无 Key 也能启动 |
| 第 5 天 | `/ai/config`、`/ai/chat`、关键词/默认降级、消息写入 | 正常与降级各通一条 |
| 第 6 天 | Redis 16 条短期记忆、历史预热、画像上下文 | 连续 8 轮上下文不串用户 |
| 第 7 天 | 只读 Tool：盲盒、线路、行程、保底规则 | 推荐事实与数据库一致 |
| 第 8 天 | AI 日记服务替换固定模板；并发和幂等；管理端用户接口 | 日记成功/降级均可用 |
| 第 9 天 | 管理端用户、统计页面接真实接口 | 无 mock 成功态 |
| 第 10 天 | 管理端 AI 配置、人格题库 CRUD 和权限 | 配置保存并审计 |
| 第 11 天 | 小程序我的、统计详情、资料编辑、人格测试 | 真数据贯通 |
| 第 12 天 | 小程序 AI、历史、降级、日记；三端联调 | 登录/游客/禁用态完整 |
| 第 13 天 | 回归、原型对照、OpenAPI 比对、验收材料和阶段五交接 | 阶段四验收包归档 |

### 6.1 分工建议

| 角色 | 负责内容 |
|---|---|
| 后端 A | 契约、统计、人格、AI 接入、Memory、Tool、日记、测试 |
| 前端 B | 小程序我的、人格、AI、日记、原型对照 |
| 前端 C | 管理端用户、统计、AI、人格配置、权限联调 |

并行原则：第 1 天冻结接口；第 2–3 天后端资产/人格与三端页面骨架并行；第 4 天以后小程序和管理端只依赖已冻结字段；AI Key 和 Redis 配置不能拖到联调阶段才准备。

---

## 7. 测试计划与验收标准

### 7.1 后端单元测试

必须覆盖：

- 有效行程统计；退款后出行、省钱、公益里程回落，徽章不回落。
- 金额分转元无浮点精度误差。
- 用户只能读取自己的统计、人格、消息和行程。
- 禁用用户所有需要登录接口返回 `403`。
- 人格题目不泄漏 `score_json`。
- 人格缺题、错选项、重复选项、非法题目顺序被拒绝。
- 游客人格结果不落库；登录人格结果和用户画像在同一事务内更新。
- AI 正常回复写入 user/ai 两条消息。
- Key 缺失、模型超时、模型异常均进入关键词或默认降级。
- Redis 记忆最多保留 16 条，用户之间不串话。
- AI Tool 只能读上架盲盒、启用线路和本人有效行程。
- AI 日记已有内容幂等返回；模型失败模板包含目的地和亮点。
- 他人行程、无效行程和不存在行程不能越权生成日记。
- 管理端角色 403、禁用审计、配置审计和人格配置校验。

### 7.2 集成验收路径

1. 使用阶段三已成功开盒的用户进入「我的」，四宫格和统计详情与数据库一致。
2. 申请并审核退款，重新请求统计，出行次数、省钱和公益里程回落，徽章保留。
3. 完成 5 题人格测试，结果页、`app_user.personality_type` 和 `personality_test` 一致。
4. 重新登录或杀掉小程序，聊天历史、人格和资产均从服务端恢复。
5. 连续对话 8 轮，小途能正确使用当前上下文，不读取其他用户历史。
6. 修改盲盒/线路上下架状态，AI 推荐不返回下架内容，名称与价格和数据库一致。
7. 删除 AI Key 或关闭模型，聊天和日记仍通过降级完成。
8. 管理端禁用用户后，该用户访问 `/me`、`/ai/messages`、`/me/stats-detail` 均返回 403。

### 7.3 模型专项验收

- 正常配置下返回小途回复，并记录消息和 token 用量。
- 模型不可用时 12 秒内完成降级，不向用户显示内部错误。
- 关键词命中优先级正确；未命中使用默认回复。
- 推荐只能来自当前上架盲盒和启用线路。
- 小途不能承诺一定抽中特定线路，不能修改订单或执行退款。
- 日记只描述当前行程快照，不编造目的地、价格和包含服务。
- Key、Prompt、模型 endpoint 和内部异常不出现在接口响应、前端页面或普通业务日志中。

### 7.4 前端构建与语法检查

```bash
cd server && mvn test -q
```

```bash
cd admin-web && npm run build
```

```bash
find miniapp -name '*.js' -print0 | xargs -0 -n1 node --check
```

同时使用 Swagger/springdoc 和接口脚本验证：

- 统计、人格、AI 配置、AI 聊天、消息历史路径。
- 401/403、参数校验、空态和错误码。
- OpenAPI 与 Controller 路径、请求体、响应字段一致。

### 7.5 原型一致性验收

用户端固定视口对照：

- 我的页游客/登录/统计详情/编辑资料。
- 人格测试入口、题目、结果、重测。
- AI 首屏、快捷问题、用户气泡、AI 气泡、历史、降级和错误。
- 行程详情日记未生成、生成中、生成完成、模板降级。

管理端固定桌面视口对照：

- 用户列表、详情抽屉、禁用/恢复。
- 统计三种时间范围和空数据。
- AI 配置保存、列表管理、权限失败。
- 人格题目、选项、结果编辑和校验失败。

每个页面必须记录：初始态截图、加载态、空态、错误态、成功态、关键点击结果、偏差文件和关闭结论。

---

## 8. 阶段交付物

- `docs/phase4-详细开发计划.md`。
- 更新后的 `docs/openapi.yaml`。
- 阶段四联调记录：AI 配置、Redis、模型正常/失败、降级样例、权限和数据隔离。
- 阶段四原型对照记录和截图。
- 后端统计、人格、AI、日记、用户管理代码与测试。
- 小程序我的资产、统计详情、资料编辑、人格、AI、日记代码。
- 管理端用户、统计、AI 配置、人格题库代码。
- 环境变量说明，不包含任何真实 Key。
- 阶段四已知问题清单和阶段五交接清单。

---

## 9. 阶段完成定义

以下条件全部满足，阶段四才算完成：

- [ ] 四宫格和统计详情完全由服务端真实数据驱动，口径与阶段三一致。
- [ ] 退款后有效资产统计回落，徽章仍保留。
- [ ] 人格测试服务端计分，结果可持久化、查询和重测。
- [ ] AI 正常对话、最近历史、16 条短期记忆和画像上下文可用。
- [ ] AI 推荐名称、价格、保底和线路事实与当前数据库一致。
- [ ] 模型 Key 缺失或超时仍能关键词/默认回复降级。
- [ ] AI 日记成功和模板降级均包含行程目的地与亮点，且不能越权或编造事实。
- [ ] 管理端用户、统计、AI 配置和人格配置使用真实接口，角色权限由服务端强制执行。
- [ ] 小程序和管理端原型对照无未关闭的产品级差异。
- [ ] `mvn test -q`、`npm run build`、小程序 JS 语法检查通过。
- [ ] 无 Key、Prompt、endpoint 或内部异常泄漏到仓库、接口和前端。
- [ ] 联调记录、截图、测试报告和已知问题已归档。

---

## 10. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|---|---:|---:|---|
| Spring AI 版本与 Spring Boot 不兼容 | 中 | 高 | 第 1 天锁版本；先验证最小 ChatClient；保留降级实现 |
| 模型 Key 缺失或额度不足 | 高 | 中 | 模型关闭也可启动；关键词/默认回复作为验收主路径之一 |
| AI 编造价格或已下架线路 | 中 | 高 | Tool 只读数据库；Prompt 写硬约束；服务端过滤事实结果 |
| Redis 记忆串用户 | 中 | 高 | key 必须包含 userId/sessionId；增加跨用户隔离测试 |
| 统计口径与阶段三不一致 | 中 | 高 | 复用阶段三口径；退款后用数据库验收；禁止前端计算全局统计 |
| 人格计分被前端篡改 | 中 | 中 | 不下发 score_json；服务端按选项重新计算 |
| AI 页面仍显示本地假数据 | 高 | 中 | 列表/聊天成功态必须来自接口；无接口只显示加载/错误/空态 |
| 日记生成覆盖已有内容 | 中 | 中 | 已有内容幂等返回；条件更新和并发测试 |
| 管理端只做前端权限 | 中 | 高 | Controller/Service 双层角色校验；所有变更审计 |
| 阶段范围膨胀到社区和 RAG | 中 | 中 | 本计划明确第一期不做向量 RAG、长期摘要和阶段五功能 |

---

## 11. 阶段五交接

阶段四结束时固定以下交接边界：

- 社区、打卡和成就只能复用用户身份、行程、徽章和统计查询，不得改变交易状态机。
- AI 只能读取已授权的用户画像、有效行程和当前内容；不能修改订单、支付、退款、徽章或积分。
- 统一保留 `userId`、`tripId`、`conversationId` 的数据隔离规则。
- 将 AI 降级策略、人格结果字段和统计口径作为阶段五依赖文档。
- 阶段四遗留的长期画像摘要、完整 RAG、AI 运营分析和更细的用户画像，登记为后续迭代，不在阶段五开发中隐式插入。

---

*文档版本：v1.0*  
*更新时间：2026-09-19*  
*负责人：待定*
