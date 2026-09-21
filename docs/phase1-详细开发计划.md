# 阶段一：地基与承重墙 — 详细开发计划

> 版本：v1.0
> 阶段：Phase 1
> 更新时间：2026-09-20
> Timebox：1.5 周（10个工作日）

---

## 1. 阶段目标

**核心目标**：三端骨架能启动、数据库能建、种子数据能灌、接口契约能 Mock

### 1.1 交付物清单

| 交付物 | 说明 | 优先级 |
|--------|------|--------|
| 后端工程 `server/` | Spring Boot 3 + MyBatis-Plus，可直接启动 | P0 |
| 数据库 41 张表 | `docs/schema.sql` 全部执行 | P0 |
| 种子数据 | `docs/seed.sql` A/B/C 三段全部导入 | P0 |
| 管理端 `admin-web/` | Vue 3.5 + Element Plus，可登录 | P0 |
| 小程序 `miniapp/` | 原生微信小程序，5 个 tab 可切换 | P1 |
| 接口契约 `docs/openapi.yaml` | 覆盖全部 140 个接口 | P0 |
| 冒烟测试通过 | `GET /api/v1/boxes` 返回 6 个盲盒 | P0 |

### 1.2 验收标准

- [x] `server/` 能启动，端口 8080
- [x] `mysql> show tables` 显示 41 张表
- [x] `GET http://localhost:8080/api/v1/boxes` 返回统一响应体与 6 条盲盒
- [ ] `admin-web/` 能启动，端口 5173，登录页可用 `admin/tuge` 登录
- [ ] `miniapp/` 能在微信开发者工具打开，5 个 tab 能切换
- [x] `docs/openapi.yaml` 格式校验通过

---

## 2. 技术栈确认

### 2.1 技术选型

| 端 | 技术栈 | 版本要求 |
|---|--------|----------|
| 用户端 | 原生微信小程序（WXML + WXSS + JS/TS） | 微信开发者工具 latest |
| 管理端 | Vue 3.5 + Vite 5 + TypeScript + Element Plus | Vue >= 3.4 |
| 后端 | Spring Boot 3 + MyBatis-Plus + JDK 17 | Spring Boot >= 3.2 |
| 数据库 | MySQL 8.0 | MySQL >= 8.0 |
| 缓存 | Redis 7 | - |
| API 文档 | SpringDoc OpenAPI 2.x | - |

### 2.2 设计规范

**小程序配色**（`app.wxss` 全局变量）：
```css
:root {
  --color-primary: #FF6B35;      /* 活力橙，主色调 */
  --color-secondary: #1A1A2E;   /* 深藏青，次要/背景 */
  --color-warm: #FFF1EB;        /* 暖白，浅色背景 */
  --color-soft: #F8F9FF;        /* 柔紫蓝，卡片背景 */
  --color-text: #333333;        /* 正文黑 */
  --color-text-light: #999999;  /* 次要文字 */
  --color-border: #EEEEEE;      /* 边框线 */
  --color-success: #52C41A;      /* 成功 */
  --color-warning: #FAAD14;      /* 警告 */
  --color-error: #FF4D4F;       /* 错误 */
}
```

**统一响应体**：
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

**金额约定**：接口层用「元」（number，最多两位小数），数据库用「分」（INT UNSIGNED）。

---

## 3. 工作分解（WBS）

### 3.1 后端（server/）

#### 3.1.1 工程初始化

**负责人**：后端开发
**预计工时**：0.5 天

```
server/
├── pom.xml                          # Maven 配置
├── src/main/java/com/tuge/
│   └── TuGeApplication.java         # 启动类
├── src/main/resources/
│   ├── application.yml              # 主配置
│   ├── application-dev.yml          # 开发环境
│   └── application-prod.yml         # 生产环境
└── src/test/java/
```

**pom.xml 核心依赖**：
```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- MyBatis-Plus -->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        <version>3.5.5</version>
    </dependency>

    <!-- MySQL -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
    </dependency>

    <!-- Redis -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>

    <!-- OpenAPI -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.3.0</version>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

**application.yml 核心配置**：
```yaml
server:
  port: 8080

spring:
  application:
    name: tuge-server
  datasource:
    url: jdbc:mysql://localhost:3306/tuge?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: ${MYSQL_PASSWORD}
  redis:
    host: localhost
    port: 6379

mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-here-change-in-production}
  expiration: 604800000  # 7天（毫秒）

pay:
  mock-enabled: true
```

#### 3.1.2 数据库建表

**负责人**：后端开发
**预计工时**：0.5 天

**执行步骤**：
```bash
# 1. 启动 MySQL（如果未启动）
mysql.server start

# 2. 执行建表脚本
mysql -uroot -p < docs/schema.sql

# 3. 验证表数量
mysql -uroot -p tuge -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='tuge';"
# 期望结果：41
```

**预期输出**：
```
+-------------+
| table_count |
+-------------+
|          41 |
+-------------+
```

#### 3.1.3 种子数据导入

**负责人**：后端开发
**预计工时**：0.5 天

**执行步骤**：
```bash
# 1. 导入种子数据
mysql -uroot -p tuge < docs/seed.sql

# 2. 验证盲盒数据
mysql -uroot -p tuge -e "SELECT id, name, category, price_cent FROM blind_box;"
# 期望：6 条记录
```

**预期输出**：
```
+----+---------------------------+----------+-------------+
| id | name                      | category | price_cent  |
+----+---------------------------+----------+-------------+
|  1 | 周边微度假盲盒            | nearby   |        9900 |
|  2 | 隐世古村慢生活盒          | nearby   |       12900 |
|  3 | 山野露营观星盲盒          | nearby   |       15900 |
|  4 | 省内仙山问道二日          | province |       29900 |
|  5 | 跨省限定冒险盲盒          | cross    |       59900 |
|  6 | 老城寻味美食专线          | theme    |       11900 |
+----+---------------------------+----------+-------------+
```

#### 3.1.4 统一响应体与异常处理

**负责人**：后端开发
**预计工时**：1 天

```
src/main/java/com/tuge/common/
├── result/
│   ├── Result.java              # 统一响应包装
│   ├── ResultCode.java          # 业务错误码枚举
│   └── PageResult.java          # 分页响应
└── exception/
    ├── GlobalExceptionHandler.java
    ├── BusinessException.java
    └── UnauthenticatedException.java
```

**Result.java**：
```java
package com.tuge.common.result;

public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.setCode(0);
        r.setMessage("success");
        r.setData(data);
        return r;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(int code, String message) {
        Result<T> r = new Result<>();
        r.setCode(code);
        r.setMessage(message);
        return r;
    }

    // getters/setters
}
```

**GlobalExceptionHandler.java**：
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public Result<Void> handleUnauthenticatedException(UnauthenticatedException e) {
        return Result.error(401, "未登录或登录已过期");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("参数校验失败");
        return Result.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(500, "系统繁忙，请稍后重试");
    }
}
```

#### 3.1.5 JWT 认证骨架

**负责人**：后端开发
**预计工时**：1 天

```
src/main/java/com/tuge/common/
├── jwt/
│   ├── JwtTokenUtil.java        # Token 生成与验证
│   └── JwtContext.java          # ThreadLocal 持有用户ID
└── auth/
    ├── AuthInterceptor.java     # 用户端拦截器
    ├── AdminAuthInterceptor.java # 管理端拦截器
    └── WebMvcConfig.java         # 拦截器配置
```

**JwtTokenUtil.java**：
```java
@Component
public class JwtTokenUtil {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String generateToken(Long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes()))
                .compact();
    }

    public Long parseUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.parseLong(claims.getSubject());
    }

    public boolean validateToken(String token) {
        try {
            parseUserId(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

#### 3.1.6 业务单号生成器

**负责人**：后端开发
**预计工时**：0.5 天

```java
@Component
public class BizNoGenerator {

    // 格式：前缀 + yyyyMMdd + 6位日序
    // 示例：T20260918000001, R20260918000001, F20260918000001

    public String generate(String prefix) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%06d", getDailySequence(prefix, date));
        return prefix + date + seq;
    }

    // 使用 Redis INCR 实现原子性日序
    private long getDailySequence(String prefix, String date) {
        String key = String.format("seq:%s:%s", prefix, date);
        Long seq = redisTemplate.opsForValue().increment(key);
        return seq != null ? seq : 1;
    }
}
```

#### 3.1.7 Swagger 接入

**负责人**：后端开发
**预计工时**：0.5 天

**访问地址**：
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

#### 3.1.8 冒烟测试接口

**负责人**：后端开发
**预计工时**：0.5 天

```java
@RestController
@RequestMapping("/api/v1")
public class BoxController {

    @Autowired
    private BlindBoxService boxService;

    @GetMapping("/boxes")
    public Result<PageResult<BlindBoxVO>> listBoxes(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String mood,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(boxService.listBoxes(category, mood, page, pageSize));
    }
}
```

**验证命令**：
```bash
curl -s http://localhost:8080/api/v1/boxes | jq .
```

**预期输出**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "周边微度假盲盒",
        "category": "nearby",
        "tag": "周边游",
        "priceCent": 99.00,
        "status": "on"
      }
      // ... 6 条
    ],
    "total": 6,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 3端开发进度

| 任务 | 预计工时 | 依赖 | 状态 |
|------|----------|------|------|
| 3.1.1 工程初始化 | 0.5天 | - | TODO |
| 3.1.2 数据库建表 | 0.5天 | MySQL就绪 | TODO |
| 3.1.3 种子数据导入 | 0.5天 | 3.1.2 | TODO |
| 3.1.4 统一响应体 | 1天 | 3.1.1 | TODO |
| 3.1.5 JWT认证骨架 | 1天 | 3.1.1 | TODO |
| 3.1.6 业务单号生成器 | 0.5天 | Redis就绪 | TODO |
| 3.1.7 Swagger接入 | 0.5天 | 3.1.1 | TODO |
| 3.1.8 冒烟测试接口 | 0.5天 | 3.1.2, 3.1.4 | TODO |
| **小计** | **5天** | | |

---

### 3.2 管理端（admin-web/）

#### 3.2.1 工程初始化

**负责人**：前端开发（管理端）
**预计工时**：0.5 天

**创建命令**：
```bash
# 使用 pnpm 创建 Vue 项目
pnpm create vue@latest admin-web --default

# 进入目录并安装依赖
cd admin-web
pnpm install

# 安装 Element Plus
pnpm add element-plus @element-plus/icons-vue

# 安装路由、状态管理、HTTP 客户端
pnpm add vue-router@4 pinia axios
```

**项目结构**：
```
admin-web/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── api/                      # API 请求封装
│   │   └── index.ts              # axios 实例
│   ├── assets/
│   │   └── styles/
│   │       └── variables.scss     # Element Plus 变量覆盖
│   ├── components/
│   │   └── layout/
│   │       ├── AppLayout.vue      # 主布局
│   │       ├── Sidebar.vue        # 侧边栏
│   │       └── Header.vue         # 顶栏
│   ├── composables/
│   │   └── useTable.ts           # 通用表格组合式函数
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   ├── user.ts               # 用户状态
│   │   └── app.ts                # 全局状态
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── utils/
│   │   └── storage.ts            # 存储工具
│   └── views/                     # 页面
│       ├── dashboard/
│       │   └── index.vue
│       ├── auth/
│       │   └── login.vue
│       ├── boxes/
│       │   └── index.vue
│       ├── routes/
│       │   └── index.vue
│       ├── badges/
│       │   └── index.vue
│       ├── banners/
│       │   └── index.vue
│       ├── ai/
│       │   └── index.vue
│       ├── quiz/
│       │   └── index.vue
│       ├── orders/
│       │   └── index.vue
│       ├── refunds/
│       │   └── index.vue
│       ├── trips/
│       │   └── index.vue
│       ├── users/
│       │   └── index.vue
│       ├── stats/
│       │   └── index.vue
│       ├── tokens/
│       │   └── index.vue
│       └── settings/
│           └── index.vue
└── public/
```

#### 3.2.2 布局骨架

**负责人**：前端开发（管理端）
**预计工时**：1 天

**AppLayout.vue 结构**：
```
+------------------------------------------+
| Header: Logo | 面包屑 | 用户信息 | 角色切换 |
+----------+------------------------------+
|          |                              |
| Sidebar  |     <router-view />           |
|          |                              |
| 14个菜单 |     内容区域                   |
|          |                              |
+----------+------------------------------+
```

**侧边栏菜单配置**：
```typescript
const menuItems = [
  { path: '/dashboard', title: '工作台', icon: Dashboard },
  { path: '/boxes', title: '盲盒管理', icon: Box },
  { path: '/routes', title: '线路管理', icon: Map },
  { path: '/badges', title: '徽章管理', icon: Medal },
  { path: '/banners', title: '运营位', icon: Picture },
  { path: '/ai', title: 'AI配置', icon: Robot },
  { path: '/quiz', title: '人格测试', icon: QuestionFilled },
  { path: '/orders', title: '订单管理', icon: Document },
  { path: '/refunds', title: '退款审核', icon: Money },
  { path: '/trips', title: '行程管理', icon: Compass },
  { path: '/users', title: '用户管理', icon: User },
  { path: '/stats', title: '数据统计', icon: DataAnalysis },
  { path: '/tokens', title: '积分管理', icon: Coin },
  { path: '/settings', title: '系统设置', icon: Setting },
]
```

#### 3.2.3 路由占位页

**负责人**：前端开发（管理端）
**预计工时**：1 天

**14个占位页内容模板**：
```vue
<template>
  <div class="page-container">
    <h2>{{ pageTitle }}</h2>
    <el-card>
      <el-empty description="功能开发中..." />
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineProps<{ pageTitle: string }>()
</script>
```

#### 3.2.4 axios 封装

**负责人**：前端开发（管理端）
**预计工时**：0.5 天

**src/api/index.ts**：
```typescript
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
})

// 请求拦截器：注入 Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一解包 + 401 处理
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      router.push('/login')
    }
    ElMessage.error(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
```

#### 3.2.5 useTable Composable

**负责人**：前端开发（管理端）
**预计工时**：0.5 天

**src/composables/useTable.ts**：
```typescript
import { ref, reactive } from 'vue'
import type { FormInstance } from 'element-plus'

export function useTable<T = any>(api: (params: any) => Promise<any>) {
  const loading = ref(false)
  const dataList = ref<T[]>([])
  const total = ref(0)
  const queryParams = reactive({
    page: 1,
    pageSize: 10,
  })

  const search = async () => {
    loading.value = true
    try {
      const res = await api(queryParams)
      dataList.value = res.data.list
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  const reset = (formRef?: FormInstance) => {
    formRef?.resetFields()
    queryParams.page = 1
    search()
  }

  const handlePageChange = (page: number) => {
    queryParams.page = page
    search()
  }

  const handleSizeChange = (size: number) => {
    queryParams.pageSize = size
    queryParams.page = 1
    search()
  }

  return {
    loading,
    dataList,
    total,
    queryParams,
    search,
    reset,
    handlePageChange,
    handleSizeChange,
  }
}
```

#### 3.2.6 登录页与角色切换

**负责人**：前端开发（管理端）
**预计工时**：1 天

**演示角色**：
| 角色 | 账号 | 密码 | 权限 |
|------|------|------|------|
| 超级管理员 | admin | tuge | 全部功能 |
| 运营管理员 | operator | tuge | 内容+订单 |
| 客服 | service | tuge | 用户+退款 |
| 财务 | finance | tuge | 订单+统计 |
| 数据分析师 | data | tuge | 统计+数据导出 |

**login.vue 核心逻辑**：
```typescript
const handleLogin = async () => {
  try {
    const res = await request.post('/api/v1/admin/auth/login', {
      username: form.username,
      password: form.password,
    })
    localStorage.setItem('admin_token', res.data.token)
    localStorage.setItem('admin_user', JSON.stringify(res.data.user))
    router.push('/dashboard')
  } catch (error) {
    // 错误已在拦截器处理
  }
}
```

#### 3端开发进度

| 任务 | 预计工时 | 依赖 | 状态 |
|------|----------|------|------|
| 3.2.1 工程初始化 | 0.5天 | - | TODO |
| 3.2.2 布局骨架 | 1天 | 3.2.1 | TODO |
| 3.2.3 14个占位页 | 1天 | 3.2.2 | TODO |
| 3.2.4 axios封装 | 0.5天 | 3.2.1 | TODO |
| 3.2.5 useTable封装 | 0.5天 | 3.2.1 | TODO |
| 3.2.6 登录页+角色 | 1天 | 3.2.4 | TODO |
| **小计** | **4.5天** | | |

---

### 3.3 用户端（miniapp/）

#### 3.3.1 工程初始化

**负责人**：前端开发（小程序）
**预计工时**：0.5 天

**创建步骤**：
1. 打开微信开发者工具
2. 点击「新建项目」
3. 选择「小程序」类型
4. 填写 AppID（个人主体或企业主体）
5. 项目名称：`tuge-miniapp`
6. 开发模式：确定

**项目结构**：
```
miniapp/
├── app.js                        # 应用入口
├── app.json                      # 全局配置
├── app.wxss                      # 全局样式
├── project.config.json           # 项目配置
├── sitemap.json                  # SEO配置
├── pages/                        # 页面
│   ├── index/                    # 首页
│   │   ├── index.js
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.json
│   ├── ai/                       # AI搭子
│   ├── community/                # 社区
│   ├── badges/                   # 图鉴
│   ├── trips/                    # 行程
│   └── mine/                     # 我的
├── components/                   # 公共组件
│   ├── BrandHeader/
│   ├── MoodSelector/
│   ├── BannerSwiper/
│   ├── CategoryTabs/
│   ├── BlindBoxCard/
│   ├── OpenBoxModal/
│   └── EmptyState/
├── utils/                        # 工具
│   ├── request.js                # 请求封装
│   ├── auth.js                   # 认证工具
│   ├── storage.js                # 存储工具
│   └── constants.js              # 常量
├── services/                     # API 服务层
│   └── api.js
└── assets/                       # 静态资源
    └── images/
```

#### 3.3.2 TabBar 配置

**负责人**：前端开发（小程序）
**预计工时**：0.5 天

**app.json**：
```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#FF6B35",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "assets/tabs/home.png",
        "selectedIconPath": "assets/tabs/home-active.png"
      },
      {
        "pagePath": "pages/ai/index",
        "text": "AI搭子",
        "iconPath": "assets/tabs/ai.png",
        "selectedIconPath": "assets/tabs/ai-active.png"
      },
      {
        "pagePath": "pages/community/index",
        "text": "社区",
        "iconPath": "assets/tabs/community.png",
        "selectedIconPath": "assets/tabs/community-active.png"
      },
      {
        "pagePath": "pages/badges/index",
        "text": "图鉴",
        "iconPath": "assets/tabs/badges.png",
        "selectedIconPath": "assets/tabs/badges-active.png"
      },
      {
        "pagePath": "pages/trips/index",
        "text": "行程",
        "iconPath": "assets/tabs/trips.png",
        "selectedIconPath": "assets/tabs/trips-active.png"
      },
      {
        "pagePath": "pages/mine/index",
        "text": "我的",
        "iconPath": "assets/tabs/mine.png",
        "selectedIconPath": "assets/tabs/mine-active.png"
      }
    ]
  }
}
```

#### 3.3.3 设计 Token 与全局样式

**负责人**：前端开发（小程序）
**预计工时**：0.5 天

**app.wxss**：
```css
/* 设计 Token */
page {
  --color-primary: #FF6B35;
  --color-secondary: #1A1A2E;
  --color-warm: #FFF1EB;
  --color-soft: #F8F9FF;
  --color-text: #333333;
  --color-text-light: #999999;
  --color-border: #EEEEEE;
  --color-success: #52C41A;
  --color-warning: #FAAD14;
  --color-error: #FF4D4F;

  /* 字体 */
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-xxl: 24px;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* 全局重置 */
page {
  background-color: #F8F9FF;
  color: var(--color-text);
  font-size: var(--font-size-md);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

#### 3.3.4 请求封装

**负责人**：前端开发（小程序）
**预计工时**：0.5 天

**utils/request.js**：
```javascript
const BASE_URL = 'http://localhost:8080/api/v1'

function request(options) {
  return new Promise((resolve, reject) => {
    // 获取本地 Token
    const token = wx.getStorageSync('token')

    const header = {
      'Content-Type': 'application/json',
      ...options.header,
    }

    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    wx.showLoading({ title: '加载中...', mask: true })

    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: 30000,
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          const data = res.data
          if (data.code === 0) {
            resolve(data.data)
          } else {
            wx.showToast({ title: data.message || '请求失败', icon: 'none' })
            reject(new Error(data.message))
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('user')
          wx.navigateTo({ url: '/pages/login/main' })
          reject(new Error('未登录'))
        } else {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}

module.exports = {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url, data) => request({ url, method: 'DELETE', data }),
}
```

#### 3.3.5 认证工具

**负责人**：前端开发（小程序）
**预计工时**：0.5 天

**utils/auth.js**：
```javascript
// 检查登录状态
function checkLogin() {
  const token = wx.getStorageSync('token')
  return !!token
}

// 获取用户信息
function getUser() {
  const userStr = wx.getStorageSync('user')
  return userStr ? JSON.parse(userStr) : null
}

// 保存登录信息
function saveLogin(token, user) {
  wx.setStorageSync('token', token)
  wx.setStorageSync('user', JSON.stringify(user))
}

// 清除登录信息
function clearLogin() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('user')
}

// 需要登录的装饰器（小程序不支持装饰器，用函数包装）
function requireLogin(callback) {
  if (checkLogin()) {
    callback()
  } else {
    wx.navigateTo({ url: '/pages/login/main' })
  }
}

module.exports = {
  checkLogin,
  getUser,
  saveLogin,
  clearLogin,
  requireLogin,
}
```

#### 3.3.6 Spike 验证任务

**负责人**：前端开发（小程序）
**预计工时**：2 天

##### Spike A：支付路径验证

**目标**：验证方案B（二维码/链接到外部浏览器）的可行性

**验证步骤**：
1. 后端返回 `pay_url` 和 `qr_code_base64`
2. 小程序内用 `web-view` 或 `<image>` 展示二维码
3. 确认用户可在开发者工具/真机扫码后跳转外部浏览器
4. 记录发现的问题

**验收**：
- [ ] 能生成并展示支付二维码
- [ ] 扫码能跳转沙箱收银台

##### Spike B：AI 流式验证

**目标**：验证方案C（整段返回 + 打字机）的可行性

**验证步骤**：
1. 后端 `POST /ai/chat` 返回完整文本
2. 前端用 `setInterval` 或 `requestAnimationFrame` 逐字渲染
3. 测试打字机效果流畅度
4. 记录发现的问题

**验收**：
- [ ] AI 回复能逐字显示
- [ ] 打字速度可调

##### Spike C：登录与域名验证

**目标**：验证 `wx.login` → JWT → `/me` 打通

**验证步骤**：
1. 调用 `wx.login()` 获取 code
2. 发送到后端换取 token
3. 用 token 调用 `/me` 接口
4. 确认用户信息能正确返回
5. 记录跨域和域名配置问题

**验收**：
- [ ] 登录流程完整
- [ ] Token 正确存储和使用

#### 3.3.7 页面占位

**负责人**：前端开发（小程序）
**预计工时**：1 天

**6个 Tab 页面基础结构**：

```javascript
// pages/index/index.js
Page({
  data: {
    // 页面数据
  },
  onLoad() {
    // 页面加载
  },
  onShow() {
    // 页面显示
  },
})
```

```xml
<!-- pages/index/index.wxml -->
<view class="container">
  <view class="placeholder">首页 - 功能开发中</view>
</view>
```

```css
/* pages/index/index.wxss */
.placeholder {
  padding: 100rpx;
  text-align: center;
  color: var(--color-text-light);
}
```

#### 3.3.8 接口契约覆盖

**负责人**：全栈（或接口负责人）
**预计工时**：1 天

**检查项**：
- [ ] `docs/openapi.yaml` 格式校验通过（使用 swagger-cli 或在线校验）
- [ ] 所有路径、参数、响应结构与实现一致
- [ ] 用户端 60 个接口全部覆盖
- [ ] 管理端 80 个接口全部覆盖

#### 3端开发进度

| 任务 | 预计工时 | 依赖 | 状态 |
|------|----------|------|------|
| 3.3.1 工程初始化 | 0.5天 | - | TODO |
| 3.3.2 TabBar配置 | 0.5天 | 3.3.1 | TODO |
| 3.3.3 设计Token | 0.5天 | 3.3.1 | TODO |
| 3.3.4 请求封装 | 0.5天 | 3.3.1 | TODO |
| 3.3.5 认证工具 | 0.5天 | 3.3.4 | TODO |
| 3.3.6 Spike验证 | 2天 | 后端冒烟接口 | TODO |
| 3.3.7 页面占位 | 1天 | 3.3.1 | TODO |
| 3.3.8 契约覆盖 | 1天 | - | TODO |
| **小计** | **6天** | | |

---

## 4. 并行开发策略

### 4.1 三端并行

```
第1天          第2天          第3天          第4天          第5天
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 后端：   │ │ 后端：   │ │ 后端：   │ │ 后端：   │ │ 后端：   │
│ 工程初始化│ │ 建表+种子│ │ 统一响应体│ │ JWT骨架  │ │ 冒烟测试 │
│ + Swagger│ │          │ │          │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 管理端： │ │ 管理端： │ │ 管理端： │ │ 管理端： │ │ 管理端： │
│ 工程+布局│ │ 14个占位页│ │ axios封装 │ │ useTable │ │ 登录+角色│
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 小程序： │ │ 小程序： │ │ 小程序： │ │ 小程序： │ │ 小程序： │
│ 工程+TabBar│ │ Token+请求│ │ Spike A  │ │ Spike B  │ │ Spike C  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

第6-7天
┌──────────┐ ┌──────────┐
│ 集成测试  │ │ 验收+修复 │
│ 三端联调  │ │ 文档完善 │
└──────────┘ └──────────┘
```

### 4.2 分工建议（三人）

| 角色 | 负责模块 | 每日任务 |
|------|----------|----------|
| 后端 A | server/ 全部 | Day1-5 后端任务 |
| 前端 B | admin-web/ + 契约 | Day1-5 管理端任务 |
| 前端 C | miniapp/ | Day1-5 小程序任务 |

### 4.3 接口契约冻结

- **冻结时间**：Day 3 下午
- **操作**：打 tag `v1-contract-freeze`
- **之后**：任何人修改接口需先在飞书群同步，达成共识后由接口负责人更新

---

## 5. 环境准备清单

### 5.1 开发环境依赖

| 软件 | 版本 | 用途 | 安装方式 |
|------|------|------|----------|
| JDK | 17+ | 后端运行 | brew install openjdk@17 |
| Maven | 3.9+ | 后端构建 | brew install maven |
| Node.js | 20+ | 前端运行 | brew install node |
| pnpm | 8+ | 管理端包管理 | npm i -g pnpm |
| MySQL | 8.0+ | 数据库 | brew install mysql |
| Redis | 7+ | 缓存 | brew install redis |
| 微信开发者工具 | latest | 小程序开发 | 官网下载 |

### 5.2 环境验证命令

```bash
# JDK
java -version
# 期望：openjdk 17.x.x

# Maven
mvn -version
# 期望：Apache Maven 3.9.x

# Node
node -v
# 期望：v20.x.x

# pnpm
pnpm -v
# 期望：8.x.x

# MySQL
mysql --version
# 期望：mysql  Ver 8.0.x

# Redis
redis-server --version
# 期望：Redis server v=7.x.x
```

---

## 6. 风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| MySQL/Redis 安装失败 | 低 | 高 | 准备 Docker 备用方案 |
| 小程序 AppID 申请延迟 | 中 | 中 | 先用测试号开发，正式号申请后替换 |
| 接口契约与实现不一致 | 中 | 中 | 每日站会同步，Day3 强制冻结 |
| 支付沙箱配置复杂 | 高 | 中 | Spike A 提前验证，留足 buffer |

---

## 7. 每日站会议程

**时间**：每天上午 10:00
**时长**：15 分钟

### 7.1 每人报告（2分钟/人）

1. 昨天完成了什么？
2. 今天计划做什么？
3. 遇到了什么 blockers？

### 7.2 同步事项

- 接口契约变更
- 环境问题
- 风险升级

---

## 8. 阶段产出物

### 8.1 代码仓库

```
/
├── server/                       # 后端工程（可运行）
├── admin-web/                    # 管理端工程（可运行）
├── miniapp/                      # 小程序工程（可打开）
└── docs/
    ├── openapi.yaml              # 冻结版接口契约
    └── schema.sql / seed.sql     # 数据库脚本（已执行）
```

### 8.2 部署验证

```bash
# 后端启动验证
cd server && mvn spring-boot:run &
curl http://localhost:8080/api/v1/health

# 管理端启动验证
cd admin-web && pnpm dev
# 浏览器访问 http://localhost:5173

# 小程序验证
# 微信开发者工具导入 miniapp/ 目录
```

### 8.3 冒烟测试用例

| 用例ID | 用例描述 | 预期结果 |
|--------|----------|----------|
| TC-01 | `GET /api/v1/boxes` | 返回 6 个盲盒 |
| TC-02 | `GET /api/v1/banners` | 返回 Banner 列表 |
| TC-03 | 管理端登录 `admin/tuge` | 登录成功，进入工作台 |
| TC-04 | 小程序首页 5 个 tab 切换 | 无报错，正常显示 |
| TC-05 | `GET /api/v1/health` | 返回 `{"code":0}` |

---

## 9. 下一步

阶段一验收通过后，进入**阶段二：内容域**。

**阶段二前置依赖**：
- [ ] 阶段一全部验收标准通过（微信开发者工具与管理端登录手工验收待补）
- [x] 接口契约已冻结
- [ ] Mock 服务已配置（可选，用于前端并行开发）

### 9.1 2026-09-20 收尾复核

| 检查项 | 结果 |
|--------|------|
| 服务器 MySQL 表数量 | 41 |
| `blind_box` / `travel_route` / `badge` / `banner` | 6 / 6 / 12 / 2 |
| `GET /api/v1/health` | HTTP 200，统一响应 `code=0` |
| `GET /api/v1/boxes` | HTTP 200，统一响应，6 条 |
| `GET /api/v1/banners` | HTTP 200，统一响应，2 条 |
| `GET /api/v1/badges` | HTTP 200，统一响应，12 条 |
| `GET /api-docs` | HTTP 200，OpenAPI 3.0.1 |
| `docs/openapi.yaml` | YAML 与 Redocly 语义校验通过；47 个路径与运行时 `/api-docs` 完全一致 |

当前服务器数据库账号可读但缺少 `biz_order` 的 `UPDATE` 权限，订单超时任务与管理端写操作不能在该账号下完成在线验收。该问题不影响公开只读接口验收，但在补齐服务器写权限前不得将阶段一到阶段三的写入联调标记为完成。

---

*文档版本：v1.0*
*更新时间：2026-09-20*
*负责人：待定*
