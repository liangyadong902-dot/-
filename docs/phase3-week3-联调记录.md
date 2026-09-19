# 阶段三 · 第三周联调记录

## 已接入

- 手机验证码登录：`POST /api/v1/auth/sms/send` + `POST /api/v1/auth/login/phone`，演示验证码为 `123456`；登录后签发用户 JWT，接口会校验用户存在、角色和账号状态。
- 微信登录：小程序先调用 `wx.login` 获取 code；首次授权时调用一次 `wx.getUserProfile` 并缓存资料，后续登录不重复弹授权；后端通过微信 `jscode2session` 换取真实 `openid/unionid`，再更新 `app_user`。
- 交易闭环：创建订单、订单列表/详情、取消订单、模拟支付、线路池保底校验、随机开盒、行程快照、徽章解锁。
- 订单安全：订单按用户隔离；盲盒下架不可新下单；同一用户同一盲盒的未完成订单不可重复创建；待支付单 15 分钟自动取消。
- 退款闭环：用户申请退款，管理端按 `super_admin/finance` 审核；通过后订单变为 `refunded`，对应行程变为 `invalid`。
- 管理端订单与退款列表已替换阶段二占位数据，接入真实接口。
- 小程序登录、订单、支付、行程、旅行日记均已切换真实接口，不再用本地订单/行程作为交易数据源。

## 支付开关更新

- `server/src/main/resources/application.yml` 已改为 `pay.mock-enabled: ${PAY_MOCK_ENABLED:false}`，默认不允许模拟支付直接入账。
- 本地临时联调可显式设置 `PAY_MOCK_ENABLED=true`；阶段三验收必须关闭并走支付宝沙箱 notify。
- 支付宝沙箱密钥和异步通知验签仍待接入；订单、支付流水和开盒事务结构已预留。

## 微信登录配置

- 本地开发启动：`SPRING_PROFILES_ACTIVE=dev WECHAT_APP_SECRET=你的微信AppSecret mvn spring-boot:run`。
- `dev` 环境使用本机可写的 `tuge` 数据库；默认配置连接远程库时，数据库账号必须具备 `app_user` 的 `INSERT/UPDATE` 权限。
- 微信 AppSecret 只放在后端环境变量 `WECHAT_APP_SECRET`，不能写入小程序代码。

## 验证结果

- `server`：`mvn test -q` 通过。
- `admin-web`：`npm run build` 通过。
- `miniapp`：全部 JavaScript 文件 `node --check` 通过。

## 手工验收路径

1. 小程序获取验证码，使用 `123456` 登录。
2. 首页选择上架盲盒，创建订单并确认模拟支付。
3. 订单状态变为 `opened`，行程页出现后端生成的线路快照，图鉴徽章点亮。
4. 订单详情申请退款，在管理端退款页审核，确认订单为 `refunded`、行程为无效。
