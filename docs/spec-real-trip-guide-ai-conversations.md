# Spec: 真实行程攻略与 AI 多会话

## Objective

将小程序“我的行程 / 行程详情 / 出行攻略”全部改为数据库驱动，并将 AI 的“新对话”改为服务端持久化的独立会话。

验收目标：

- 页面不再使用前端 `ROUTE_FALLBACKS` / `GUIDE_CONFIGS` 生成攻略文案。
- 行程攻略只来自 `trip.guide_snapshot_json`；旧行程缺失快照时，从对应 `travel_route.guide_json` 回填到行程后返回。
- 路线本身也缺少攻略时返回明确错误，不生成看似真实的通用行程。
- AI 可创建多个独立会话，每个会话分别读写数据库消息。
- 新建会话、发送消息、切换历史会话和重新启动小程序后恢复会话均可用。

## Tech Stack

- 小程序：原生微信小程序 JavaScript / WXML / WXSS
- 后端：Java 17、Spring Boot、MyBatis-Plus
- 数据库：MySQL，复用 `travel_route.guide_json`、`trip.guide_snapshot_json`、`chat_message.conversation_id`
- AI：现有 DeepSeek 调用与数据库降级回复保持不变

## API Contract

- `GET /api/v1/trips/{id}/guide`
  - 返回数据库行程攻略快照。
  - 旧行程缺失快照时，在同一事务中从关联路线回填。
- `GET /api/v1/ai/conversations`
  - 返回当前用户的会话摘要，按最后消息倒序。
- `POST /api/v1/ai/conversations`
  - 生成新的服务端会话 ID，不预写入假消息。
- `GET /api/v1/ai/conversations/{conversationId}/messages`
  - 只返回当前用户该会话的消息。
- `POST /api/v1/ai/chat`
  - 登录用户携带 `sessionId` 后写入对应会话；旧客户端未携带时兼容到原历史会话。

## Commands

- JS 语法：`for f in $(find miniapp -name '*.js'); do node --check "$f"; done`
- JSON 校验：`node -e '...JSON.parse(...)'`
- 后端测试：`cd server && mvn test`
- 后端构建：`cd server && mvn -q -DskipTests package`
- 样式检查：`git diff --check -- miniapp server docs`
- 手工验收：微信开发者工具中新建两个 AI 会话，分别发送消息并切换；打开行程详情和攻略。

## Project Structure

- `server/src/main/java/com/tuge/controller` → REST 接口
- `server/src/main/java/com/tuge/domain/service` → 会话与攻略业务逻辑
- `server/src/main/java/com/tuge/domain/vo` → API 返回结构
- `server/src/test/java` → 服务层测试
- `miniapp/services/api.js` → 小程序 API 封装
- `miniapp/utils/tuge-store.js` → AI 会话状态与数据同步
- `miniapp/pages/trips` / `miniapp/pages/guide` → 真实数据渲染
- `docs/seed.sql` → 路线攻略初始数据与旧行程回填

## Code Style

```java
public List<ChatMessageVO> messages(Long userId, String conversationId, int limit) {
    assertOwnedConversation(userId, conversationId);
    return messageMapper.selectList(query(userId, conversationId, limit))
            .stream().map(this::toVO).toList();
}
```

- Java 保持现有 Spring Service / VO 分层。
- JavaScript 保持 CommonJS 和当前 store 风格。
- 会话 ID 只允许服务端生成的安全字符集，所有读取同时校验 `user_id`。

## Testing Strategy

- `TripService` 单元测试：快照优先、从路线回填、路线无攻略时报错。
- `AiChatService` 单元测试：会话隔离、历史兼容、消息按会话查询、跨用户拒绝。
- Controller/API 构建检查：新路由与请求参数可用。
- 小程序手工验收：新对话、切换、重载、攻略展示、返回键。

## Boundaries

- Always: 用户和会话双重隔离；保留原消息；修改后运行测试与微信开发者工具验收。
- Ask first: 删除历史会话、破坏性数据库迁移、改变 AI 供应商。
- Never: 读取或提交密钥文件；使用前端假攻略伪装数据库数据；为修复功能清空用户消息。

## Success Criteria

1. 在数据库修改某条路线攻略后，新开盒行程展示该值，不显示前端模板值。
2. 旧行程无快照时可从关联路线回填，且回填后数据库中快照非空。
3. 一个用户创建 A/B 两个 AI 会话，两者的消息和模型记忆互不串联。
4. 重新启动小程序后，A/B 会话及其消息仍从服务端恢复。
5. 未登录访客会话和旧版客户端仍可用。

## Open Questions

无。默认保留现有 DeepSeek + fallback 机制，不新增 AI 供应商。

## Implementation Plan

1. 攻略服务取消运行时模板，增加路线快照回填事务。
2. 补齐 `travel_route.guide_json` 的完整页面字段，并将当前旧行程快照升级为对应路线数据。
3. AI 服务增加会话 ID 生成、会话摘要和按会话读消息，且记忆键按会话隔离。
4. 小程序改用会话 API，攻略与详情只渲染后端字段。
5. 运行单元测试、构建、数据库核对与微信开发者工具端到端验收。

## Tasks

- [ ] 行程攻略数据库快照化；验收：无快照回填，无路线攻略报错。
- [ ] AI 多会话后端；验收：会话列表、创建、独立消息与记忆可用。
- [ ] 小程序真实数据接入；验收：无前端攻略模板，会话可切换与恢复。
- [ ] 数据迁移与回归；验收：数据库查询、Maven 测试、小程序编译和真机操作通过。
