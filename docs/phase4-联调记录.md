# 阶段四联调记录

> 日期：2026-09-20
> 范围：用户资产、旅行人格、小途 AI、AI 日记、管理端用户/统计/AI/人格
> 详细证据：`docs/acceptance/phase3-4/README.md`

## 1. 结论

阶段四的后端、管理端和小程序代码已完成，所有当前可自动执行的验收项通过。真机微信授权/视觉检查需要开发者工具服务端口和现场扫码；真实支付宝沙箱付款/退款需要未提供的沙箱凭据。因此当前状态为：

> 除真机微信确认和真实支付宝沙箱付款/退款外，其余阶段三前置与阶段四验收项已通过。

## 2. 验收环境

- MySQL：`127.0.0.1:3306/tuge_acceptance`，仅使用本地隔离库。
- Redis：`127.0.0.1:6380`，关闭持久化。
- 后端：`http://127.0.0.1:8080`。
- 管理端：`http://127.0.0.1:5173`。
- 最终后端配置：`PAY_MOCK_ENABLED=false`、`ORDER_EXPIRY_JOB_ENABLED=false`。
- DeepSeek 和微信密钥仅位于 Git 忽略的 `server/application-local.yml`。

## 3. 后端与数据验收

- 用户资产：实际行程、消费、省钱、公益里程、目的地、日记、称号和徽章统计通过。受控模拟付款退款后，订单为 `refunded`、行程为 `invalid`，行程/省钱/公益里程回落，徽章保留。
- 人格：5 道动态题、非法答案拒绝、游客不落库、登录用户结果与重测通过。
- AI：DeepSeek 正常调用 `fallback=false`，历史和 token 用量落库，8 轮连续对话通过。
- Redis：游客 A 窗口 16 条、游客 B 2 条、登录用户 2 条，TTL 约 24 小时，双游客与登录用户相互隔离。
- AI 降级：模型关闭、缺少 Key、真实 HTTP 超时和异常路径均进入关键词/默认回复/日记模板，耗时均小于 12 秒。
- AI 工具：推荐仅读取当前上架盲盒和线路，无法读取他人行程，不具备下单、支付、退款或开盒写操作。
- AI 日记：正常生成、模板降级、重复请求幂等、并发、无效行程和跨用户拒绝均已覆盖。
- 管理端：5 种角色的用户、统计、AI 和人格读写权限通过；禁用用户返回 `403`；禁用、备注和配置修改均产生审计记录。
- 订单过期：实际待支付订单在定时任务中变为 `cancelled`，不生成行程或退款。
- notify：自动化覆盖验签失败、notify ID 重复、正常入账/开盒和金额不一致；无效通知日志不再输出完整参数。

## 4. 前端与契约验收

- 管理端 Playwright 已生成 43 张矩阵截图，覆盖用户、统计、AI、人格、订单、退款、支付流水和行程的成功、加载、空、错误和 `403` 状态，并包含登录、用户详情和 AI 只读角色。无控制台错误或视口溢出。
- 小程序全部 JavaScript 语法检查通过；AI 消息使用 `rich-text` 渲染 Markdown，标题、加粗、行内代码、链接和列表解析断言通过。
- OpenAPI 3.0.3 可解析，77 条路径、296 个内部 `$ref` 有效；运行时与冻结契约均为 77 条路径、100 个操作，无缺失或额外接口。

## 5. 自动化结果

```text
Maven tests: 54 passed, 0 failed, 0 errors, 0 skipped
Maven package: passed
Admin npm build: passed
Miniapp JS syntax: passed
Miniapp Markdown assertions: passed
OpenAPI parse/ref/runtime operation comparison: passed
Git diff whitespace check: passed
Tracked/unignored secret scan: passed
```

## 6. 未完成的外部检查点

1. `miniprogram-automator` 已在临时目录安装并通过加载检查；微信开发者工具 CLI 报告“服务端口已关闭”，命令行确认开启后仍等待 `.ide` 端口文件超时。需在 IDE 的“设置 -> 安全设置”中手工开启服务端口，再执行模拟器自动化；真机授权仍需现场扫码。
2. 支付宝沙箱 APPID、应用私钥、支付宝公钥和买家账号未提供，无法执行真实沙箱付款、合法 notify 重放、原路退款和无线路池自动退款。受控模拟链路只作为业务回归，不替代沙箱验收。

## 7. 阶段五交接

- 正式服务器使用环境变量注入 MySQL、Redis、DeepSeek、微信和支付宝凭据，不复制本地 `application-local.yml`。
- 支付默认保持 `PAY_MOCK_ENABLED=false`；真实沙箱验收前需 HTTPS notify 公网地址。
- 执行微信模拟器或真机验收时，API 地址的临时修改必须在验收后恢复为 `127.0.0.1:8080`。
- 当前本地验收服务可继续用于现场检查，不是生产部署。
