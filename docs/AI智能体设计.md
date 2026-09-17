# 途个惊喜 — AI 智能体设计

> 栈：Spring AI + Redis Memory + MySQL 长期记忆 + 智能体优化组件（Advisor / Tool / RAG）  
> 产品角色：小途 · AI 旅行搭子；另用于旅行日记生成  
> 模型：OpenAI 兼容接口（DeepSeek / 通义 / 智谱均可，配置切换）

结论：**可以，而且适合本项目。** 不必上多 Agent 编排；一个「小途」智能体 + 记忆 + 工具 + 检索就够用。

---

## 1. 为什么这套可以

| 能力 | 用在哪 |
|---|---|
| Spring AI `ChatClient` | 统一调模型，小途对话、日记生成共用 |
| Memory | 连续聊天记得上下文，而不是每句都当新会话 |
| Tool（函数调用） | 查上架盲盒、用户行程、保底规则，避免胡编价格 |
| RAG / 知识检索 | 把线路亮点、分类说明喂给模型 |
| Advisor 链 | 记忆、人设、安全、日志按固定顺序组装，方便优化 |

关键词规则**保留作降级**：模型超时或额度用尽时，仍按功能设计 2.4.3 回固定话术。

---

## 2. 智能体形态（单 Agent，不拆多角色）

不做 Planner / Researcher / Writer 三套智能体。小途是**一个旅行顾问 Agent**：

```text
用户一句话
    │
    ▼
┌─────────────────────────────────────────┐
│  ChatClient（小途）                      │
│  Advisors（按序）：                      │
│    1. 人设 + 安全约束                    │
│    2. 用户画像记忆（心情/人格/行程摘要）  │
│    3. 短期对话记忆（Redis 窗口）         │
│    4. RAG（上架盲盒与线路）              │
│    5. 日志 / Token 统计                 │
│  Tools：                                 │
│    recommendBoxes / getMyTrips /         │
│    getValueGuard / searchRoutes          │
└─────────────────────────────────────────┘
    │
    ├─ 成功 → 回复用户，写入 MySQL
    └─ 失败 → 关键词降级回复
```

日记生成是**同一套 ChatClient、另一套 Prompt**，不另起 Agent。

---

## 3. Memory（三层）

### 3.1 短期记忆（工作记忆）

- 组件：Spring AI `MessageWindowChatMemory` + `MessageChatMemoryAdvisor`
- 存储：Redis，key = `chat:mem:{conversationId}`
- `conversationId`：登录用户 = `user:{userId}`；游客 = `guest:{sessionId}`（仅会话内，不落 MySQL）
- 窗口：最近 **16 条**（约 8 轮）；超出先摘要再裁剪

### 3.2 长期记忆（对话流水）

- 表：已有 `chat_message`，登录用户每轮 user/ai 各写一条
- 用途：管理端聊天日志、AI 渗透率、从库回放进 Redis（用户重新进入 AI 页时预热最近 16 条）

### 3.3 画像记忆（跨会话稳定信息）

每次调用前组装进系统附加上下文，不占窗口名额：

| 注入字段 | 来源 |
|---|---|
| 昵称、称号、出行次数 | `app_user` + 行程汇总 |
| 最近心情、旅行人格 | `last_mood` / `personality_type` |
| 最近 3 条有效行程名 | `trip` |
| 待支付订单数 | `biz_order` |

另表 `user_ai_memory`（可选）：模型定期把旧对话压成一段「用户偏好摘要」（喜欢山野 / 怕一个人走等），下次注入。第一期可只做画像字段，摘要放到 P2。

**原则**：模型不能改订单、不能替用户开盒；记忆只用于说得更准。

---

## 4. 智能体优化组件

全部用 Spring AI / Spring 生态现成能力，不自研框架。

| 组件 | 作用 | 优化点 |
|---|---|---|
| System Prompt Advisor | 小途人设、禁止虚构售价、引导开盒但不替付 | Prompt 放管理端可改 |
| Chat Memory Advisor | 带上最近对话 | 窗口 16，超限摘要 |
| Retrieval Advisor | 检索上架盲盒/线路片段 | Redis Vector 或先关键词召回 Top5 |
| Tool Calling | 查真实库存与规则 | 价格、保底只以工具结果为准 |
| Logger Advisor | 记 prompt / 耗时 / token | 管理端可看调用量 |
| Resilience | 超时 12s、重试 1 次、熔断 | 失败走关键词降级 |
| Output 约束 | 日记用结构化输出（目的地+心情句） | 避免胡写未去过的地方 |
| 流式 SSE | 先出字再出完 | 替代原型假 600ms |

### 4.1 人设约束（必须写进 Prompt）

- 自称小途，语气轻松，不说自己是模型。  
- 推荐只能来自**当前上架盲盒**；价格、保底以工具返回为准。  
- 不承诺「一定抽到某条线路」（开盒是随机且保底）。  
- 不处理退款审核，引导去「我的 → 订单」。  
- 涉及安全：强调官方线路含向导/交通，不鼓励盲目穷游。

### 4.2 Tools（建议第一期就做）

| Tool | 入参 | 返回 |
|---|---|---|
| `recommendBoxes` | mood?, category? | 上架盲盒名称、售价、保底、简介 |
| `searchRoutes` | keyword / category | 启用线路名、目的地、亮点（不含未上架） |
| `getMyTrips` | （当前用户） | 有效行程列表摘要 |
| `getValueGuard` | 无 | 保底 120%、可退换说明 |

游客调用 `getMyTrips` 返回「未登录，无法查看行程」。

### 4.3 RAG

将上架盲盒 + 启用线路打成文档（名称、分类、心情、亮点、情绪文案）。

- **推荐**：Redis Stack Vector（和现有 Redis 一起）。  
- **可先简化**：MyBatis 按分类/心情 SQL 召回 5 条，拼进 Prompt（也算检索增强，不强制一上来 embedding）。

线路或盲盒变更后异步重建索引。

---

## 5. 两个业务场景

### 5.1 小途对话

1. 前端 `POST /ai/chat` 或 `GET/POST /ai/chat/stream`（SSE）。  
2. 后端装 Advisor + Tools，调用 ChatClient。  
3. 成功：返回文本，登录则写 `chat_message`，并更新 Redis 窗口。  
4. 失败：命中关键词规则，或默认回复库随机一条。

快捷问题与开场白仍由管理端配置；快捷问题只是自动填入用户消息。

### 5.2 旅行日记

`POST /trips/:id/diary`：把该行程快照（线路名、目的地、亮点、心情文案）交给日记 Prompt，生成一段第一人称短文，落 `trip.diary_text`。  
管理端日记模板改为 **Prompt 模板**（仍支持 `{线路名称}` `{目的地}`），不再三选一随机死句；模型不可用时才回退模板。

---

## 6. 与现有模块怎么接

| 模块 | 变化 |
|---|---|
| 功能 2.4 | 界面不变；回复由智能体生成，关键词改为降级 |
| 功能 3.6 | 增加：系统 Prompt、模型参数、是否开工具/RAG；原关键词库保留 |
| Redis | 增加对话窗口、可选向量；原验证码/支付锁不变 |
| MySQL | `chat_message` 增加 `conversation_id`、`token_usage`；可选 `user_ai_memory` |

---

## 7. 配置项（`sys_config` / application.yml）

| 项 | 说明 | 默认 |
|---|---|---|
| `ai.provider` | openai-compatible 地址与模型名 | 环境变量，不进库明文 Key |
| `ai.memory.window` | 短期条数 | 16 |
| `ai.timeout-ms` | 调用超时 | 12000 |
| `ai.tools.enabled` | 是否启用工具 | true |
| `ai.rag.enabled` | 是否启用检索 | 第一期可 false，用 Tool 代替 |
| `ai.fallback.keyword` | 失败是否关键词降级 | true |

API Key 只放环境变量 / 本地配置，禁止提交仓库。

---

## 8. 依赖（后端）

```text
spring-boot-starter-web
mybatis-plus-spring-boot3-starter
spring-boot-starter-data-redis
mysql-connector-j
spring-ai-starter-model-openai          # OpenAI 兼容协议
spring-ai-starter-vector-store-redis    # RAG 启用时
# 可选：spring-ai-alibaba-starter（若固定用通义）
```

前端仍是 Vue，聊天页对 SSE 做逐字展示即可，不引入额外 AI SDK。

---

## 9. 不做（避免把毕设做成框架拼盘）

- 不上多 Agent 互相开会。  
- 不上自动改订单、自动支付的 Tool。  
- 不把完整聊天记录每次都塞进上下文（只用窗口 + 画像）。  
- 不在前端写 Prompt 和 Key。
