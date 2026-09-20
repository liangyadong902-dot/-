-- 途个惊喜 · 建表 DDL
-- 与 docs/数据库设计.md 一一对应，改结构两边一起改
--
-- 执行：mysql -uroot -p < docs/schema.sql
-- 然后：mysql -uroot -p tuge < docs/seed.sql
--
-- 约定（见数据库设计 §0）：
--   金额单位分（INT UNSIGNED）· 时间 DATETIME(3) 存北京时间 · 不用软删除
--   不建物理外键，只建索引 · 状态存英文枚举值 · utf8mb4 / utf8mb4_0900_ai_ci
--   每表 created_at / updated_at 由 DEFAULT / ON UPDATE 维护

SET NAMES utf8mb4;
SET time_zone = '+08:00';

CREATE DATABASE IF NOT EXISTS `tuge`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `tuge`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `checkin_like`;
DROP TABLE IF EXISTS `post_comment`;
DROP TABLE IF EXISTS `post_interaction`;
DROP TABLE IF EXISTS `community_post`;
DROP TABLE IF EXISTS `user_achievement`;
DROP TABLE IF EXISTS `achievement`;
DROP TABLE IF EXISTS `checkin`;
DROP TABLE IF EXISTS `topic`;
DROP TABLE IF EXISTS `user_topic_follow`;
DROP TABLE IF EXISTS `admin_audit_log`;
DROP TABLE IF EXISTS `admin_user`;
DROP TABLE IF EXISTS `sys_config`;
DROP TABLE IF EXISTS `stats_daily`;
DROP TABLE IF EXISTS `mood_log`;
DROP TABLE IF EXISTS `personality_test`;
DROP TABLE IF EXISTS `personality_result`;
DROP TABLE IF EXISTS `personality_option`;
DROP TABLE IF EXISTS `personality_question`;
DROP TABLE IF EXISTS `diary_template`;
DROP TABLE IF EXISTS `ai_quick_question`;
DROP TABLE IF EXISTS `ai_default_reply`;
DROP TABLE IF EXISTS `ai_keyword_rule`;
DROP TABLE IF EXISTS `user_ai_memory`;
DROP TABLE IF EXISTS `chat_message`;
DROP TABLE IF EXISTS `trip`;
DROP TABLE IF EXISTS `refund_order`;
DROP TABLE IF EXISTS `payment_flow`;
DROP TABLE IF EXISTS `biz_order`;
DROP TABLE IF EXISTS `banner`;
DROP TABLE IF EXISTS `user_badge`;
DROP TABLE IF EXISTS `badge`;
DROP TABLE IF EXISTS `travel_route`;
DROP TABLE IF EXISTS `blind_box_scene`;
DROP TABLE IF EXISTS `blind_box_mood`;
DROP TABLE IF EXISTS `blind_box`;
DROP TABLE IF EXISTS `app_user`;

SET FOREIGN_KEY_CHECKS = 1;


-- ═══════════════════════════════════════════════════════
-- 3.1 用户
-- ═══════════════════════════════════════════════════════
CREATE TABLE `app_user` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户 ID',
  `phone`            VARCHAR(20)      DEFAULT NULL COMMENT '手机号，登录账号；微信未绑定可空',
  `wechat_openid`    VARCHAR(64)      DEFAULT NULL COMMENT '微信 OpenID',
  `wechat_unionid`   VARCHAR(64)      DEFAULT NULL COMMENT '微信 UnionID',
  `nickname`         VARCHAR(64)      NOT NULL DEFAULT '旅行探险家' COMMENT '昵称',
  `avatar_url`       VARCHAR(512)     NOT NULL DEFAULT '' COMMENT '头像',
  `gender`           TINYINT          DEFAULT NULL COMMENT '0 未知 / 1 男 / 2 女',
  `city`             VARCHAR(64)      DEFAULT NULL COMMENT '常驻城市',
  `register_channel` VARCHAR(16)      NOT NULL COMMENT '注册渠道 phone / wechat',
  `status`           VARCHAR(16)      NOT NULL DEFAULT 'normal' COMMENT 'normal / disabled',
  `disabled_reason`  VARCHAR(255)     DEFAULT NULL COMMENT '禁用原因，管理端内部可见',
  `last_mood`        VARCHAR(16)      DEFAULT NULL COMMENT '最近一次选中的心情',
  `personality_type` VARCHAR(32)      DEFAULT NULL COMMENT '最近一次人格测试结果',
  `personality_at`   DATETIME(3)      DEFAULT NULL COMMENT '最近一次测试时间',
  `last_login_at`    DATETIME(3)      DEFAULT NULL COMMENT '最近一次鉴权成功',
  `last_active_at`   DATETIME(3)      DEFAULT NULL COMMENT '最近一次关键行为，用于 DAU',
  `cs_note`          VARCHAR(500)     DEFAULT NULL COMMENT '客服备注，用户不可见',
  `created_at`       DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone`  (`phone`),
  UNIQUE KEY `uk_openid` (`wechat_openid`),
  KEY `idx_status_created` (`status`, `created_at`),
  KEY `idx_last_active`    (`last_active_at`),
  KEY `idx_channel`        (`register_channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户';


-- ═══════════════════════════════════════════════════════
-- 3.2 盲盒
-- ═══════════════════════════════════════════════════════
CREATE TABLE `blind_box` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(64)     NOT NULL COMMENT '盲盒名称',
  `category`        VARCHAR(16)     NOT NULL COMMENT 'nearby / province / cross / theme，决定线路池',
  `tag`             VARCHAR(32)     NOT NULL COMMENT '展示标签，如「周边游」',
  `rank_tag`        VARCHAR(8)      DEFAULT NULL COMMENT '角标 TOP1 / HOT / NEW，空则不显示',
  `intro`           VARCHAR(255)    NOT NULL COMMENT '一句话卖点',
  `price_cent`      INT UNSIGNED    NOT NULL COMMENT '售价（分）',
  `min_value_cent`  INT UNSIGNED    NOT NULL COMMENT '保底票面价值（分）',
  `cover_url`       VARCHAR(512)    DEFAULT NULL COMMENT '封面图',
  `sort_weight`     INT             NOT NULL DEFAULT 0 COMMENT '越大越靠前',
  `status`          VARCHAR(8)      NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `open_count`      INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '开盒次数冗余计数，可重建（见数据库设计 §7）',
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cat_status_sort` (`category`, `status`, `sort_weight`),
  KEY `idx_status`          (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='盲盒';

CREATE TABLE `blind_box_mood` (
  `box_id` BIGINT UNSIGNED NOT NULL,
  `mood`   VARCHAR(16)     NOT NULL COMMENT 'happy / emo / bored / curious',
  PRIMARY KEY (`box_id`, `mood`),
  KEY `idx_mood` (`mood`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='盲盒适配心情';

CREATE TABLE `blind_box_scene` (
  `box_id` BIGINT UNSIGNED NOT NULL,
  `scene`  VARCHAR(16)     NOT NULL COMMENT '景点类型：mountain / water / ancient_town / sea / camp / food / red / village / art / adventure / study / photography',
  PRIMARY KEY (`box_id`, `scene`),
  KEY `idx_scene` (`scene`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='盲盒适配景点类型（仅作筛选，不约束开盒）';


-- ═══════════════════════════════════════════════════════
-- 3.3 线路
-- ═══════════════════════════════════════════════════════
CREATE TABLE `travel_route` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(128)    NOT NULL COMMENT '线路名称',
  `category`    VARCHAR(16)     NOT NULL COMMENT '归属盲盒池',
  `location`    VARCHAR(128)    NOT NULL COMMENT '目的地',
  `scene`       VARCHAR(16)     NOT NULL COMMENT '景点类型（见 blind_box_scene.scene 同枚举）',
  `value_cent`  INT UNSIGNED    NOT NULL COMMENT '票面价值（分）',
  `cost_cent`   INT UNSIGNED    DEFAULT NULL COMMENT '采购结算价，用于日后毛利报表；本期可空',
  `badge_id`    BIGINT UNSIGNED NOT NULL COMMENT '开盒解锁徽章',
  `highlight`   TEXT            NOT NULL COMMENT '线路亮点',
  `include_json` JSON           NOT NULL COMMENT '服务包含字符串数组',
  `mood_text`   VARCHAR(255)    NOT NULL COMMENT '开盒结果页情绪文案',
  `status`      VARCHAR(8)      NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `draw_count`  INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '被抽中次数冗余计数，可重建',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_pool`   (`category`, `status`, `value_cent`),
  KEY `idx_badge`  (`badge_id`),
  KEY `idx_scene`  (`scene`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='线路池';


-- ═══════════════════════════════════════════════════════
-- 3.4 徽章
-- ═══════════════════════════════════════════════════════
CREATE TABLE `badge` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(32)     NOT NULL COMMENT '徽章名，如「古村」',
  `mark`        VARCHAR(4)      NOT NULL COMMENT '印章字，用户端圆形印章里的单字',
  `icon`        VARCHAR(128)    DEFAULT NULL COMMENT '图片图标，本期可空（前端用 mark 拼）',
  `description` VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '描述',
  `sort_weight` INT             NOT NULL DEFAULT 0,
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='徽章定义';

CREATE TABLE `user_badge` (
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `badge_id`       BIGINT UNSIGNED NOT NULL,
  `source_trip_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '首次解锁来源行程',
  `unlocked_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`, `badge_id`),
  KEY `idx_badge` (`badge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户已解锁徽章；退款不删除';


-- ═══════════════════════════════════════════════════════
-- 3.5 运营位
-- ═══════════════════════════════════════════════════════
CREATE TABLE `banner` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(64)     NOT NULL COMMENT '主标题',
  `subtitle`    VARCHAR(128)    NOT NULL DEFAULT '' COMMENT '副标题 / 卖点',
  `tag_text`    VARCHAR(32)     NOT NULL DEFAULT '' COMMENT '左上角标签，如「价值保底」',
  `image_url`   VARCHAR(512)    DEFAULT NULL,
  `jump_type`   VARCHAR(16)     NOT NULL DEFAULT 'none' COMMENT 'none / category / box / url',
  `jump_value`  VARCHAR(255)    DEFAULT NULL COMMENT '分类 key / box_id / 外链',
  `start_at`    DATETIME(3)     DEFAULT NULL,
  `end_at`      DATETIME(3)     DEFAULT NULL,
  `sort_weight` INT             NOT NULL DEFAULT 0,
  `status`      VARCHAR(8)      NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_active` (`status`, `start_at`, `end_at`, `sort_weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='首页运营位';


-- ═══════════════════════════════════════════════════════
-- 3.6 订单
-- ═══════════════════════════════════════════════════════
CREATE TABLE `biz_order` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`       VARCHAR(32)     NOT NULL COMMENT '业务单号 T+yyyyMMdd+6位日序',
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `box_id`         BIGINT UNSIGNED NOT NULL,
  `box_name`       VARCHAR(64)     NOT NULL COMMENT '盲盒名快照',
  `box_category`   VARCHAR(16)     NOT NULL COMMENT '分类快照',
  `price_cent`     INT UNSIGNED    NOT NULL COMMENT '应付（分）',
  `paid_cent`      INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '实付（分），未付为 0',
  `min_value_cent` INT UNSIGNED    NOT NULL COMMENT '保底快照（分）',
  `status`         VARCHAR(16)     NOT NULL DEFAULT 'pending_pay' COMMENT 'pending_pay / paid / opened / cancelled / refunded',
  `pay_channel`    VARCHAR(16)     DEFAULT NULL COMMENT 'alipay / mock',
  `expire_at`      DATETIME(3)     NOT NULL COMMENT '待支付超时时间',
  `paid_at`        DATETIME(3)     DEFAULT NULL,
  `opened_at`      DATETIME(3)     DEFAULT NULL,
  `cancelled_at`   DATETIME(3)     DEFAULT NULL,
  `route_id`       BIGINT UNSIGNED DEFAULT NULL COMMENT '抽中线路',
  `trip_id`        BIGINT UNSIGNED DEFAULT NULL COMMENT '开盒成功后的行程',
  `version`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '乐观锁',
  -- 部分唯一：同一用户同一盲盒只允许一张未完结单，挡住并发重复下单
  `active_key`     VARCHAR(64) GENERATED ALWAYS AS (
                     CASE WHEN `status` IN ('pending_pay','paid')
                          THEN CONCAT(`user_id`, '-', `box_id`) END
                   ) STORED COMMENT '未完结订单去重键',
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no`   (`order_no`),
  UNIQUE KEY `uk_active_key` (`active_key`),
  KEY `idx_user_status` (`user_id`, `status`, `created_at`),
  KEY `idx_expire`      (`status`, `expire_at`),
  KEY `idx_box`         (`box_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单';


-- ═══════════════════════════════════════════════════════
-- 3.7 支付流水
-- ═══════════════════════════════════════════════════════
CREATE TABLE `payment_flow` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `flow_no`          VARCHAR(32)     NOT NULL COMMENT '流水号 F+yyyyMMdd+6位日序',
  `order_id`         BIGINT UNSIGNED NOT NULL,
  `order_no`         VARCHAR(32)     NOT NULL COMMENT '冗余，便于按单号查',
  `channel`          VARCHAR(16)     NOT NULL COMMENT 'alipay / mock',
  `channel_trade_no` VARCHAR(64)     DEFAULT NULL COMMENT '渠道单号（支付宝 trade_no）',
  `amount_cent`      INT UNSIGNED    NOT NULL COMMENT '金额（分）',
  `result`           VARCHAR(16)     NOT NULL COMMENT 'success / fail / closed',
  `notify_id`        VARCHAR(64)     DEFAULT NULL COMMENT '支付宝异步通知 notify_id，幂等键',
  `raw_notify`       JSON            DEFAULT NULL COMMENT '异步通知原文（验签后落库）',
  `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_flow_no`   (`flow_no`),
  UNIQUE KEY `uk_notify_id` (`notify_id`),
  KEY `idx_order`   (`order_id`),
  KEY `idx_trade`   (`channel_trade_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='支付流水；notify_id 唯一实现通知幂等';


-- ═══════════════════════════════════════════════════════
-- 3.8 退款单
-- ═══════════════════════════════════════════════════════
CREATE TABLE `refund_order` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `refund_no`         VARCHAR(32)     NOT NULL COMMENT '退款单号 R+yyyyMMdd+6位日序',
  `order_id`          BIGINT UNSIGNED NOT NULL,
  `order_no`          VARCHAR(32)     NOT NULL COMMENT '冗余',
  `user_id`           BIGINT UNSIGNED NOT NULL,
  `amount_cent`       INT UNSIGNED    NOT NULL COMMENT '退款金额（分）',
  `reason`            VARCHAR(255)    NOT NULL COMMENT '退款原因',
  `kind`              VARCHAR(32)     NOT NULL COMMENT 'draw_fail / value_guard / unused',
  `status`            VARCHAR(16)     NOT NULL DEFAULT 'pending_review' COMMENT 'auto / pending_review / approved / rejected',
  `channel_refund_no` VARCHAR(64)     DEFAULT NULL COMMENT '支付宝退款单号',
  `reviewer_id`       BIGINT UNSIGNED DEFAULT NULL COMMENT '审核管理员',
  `reject_reason`     VARCHAR(255)    DEFAULT NULL,
  `reviewed_at`       DATETIME(3)     DEFAULT NULL,
  `created_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_status`  (`status`, `created_at`),
  KEY `idx_order`   (`order_id`),
  KEY `idx_user`    (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='退款单；draw_fail 由系统自动生成无需审核';


-- ═══════════════════════════════════════════════════════
-- 3.9 行程
-- ═══════════════════════════════════════════════════════
CREATE TABLE `trip` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `order_id`     BIGINT UNSIGNED NOT NULL,
  `route_id`     BIGINT UNSIGNED NOT NULL,
  `box_id`       BIGINT UNSIGNED NOT NULL COMMENT '开盒时的盲盒，供按分类下钻',
  `box_name`     VARCHAR(64)     NOT NULL COMMENT '快照',
  `box_category` VARCHAR(16)     NOT NULL COMMENT '快照，供偏好分类统计',
  `price_cent`   INT UNSIGNED    NOT NULL COMMENT '购入价快照（分）',
  `route_name`   VARCHAR(128)    NOT NULL COMMENT '线路名快照',
  `location`     VARCHAR(128)    NOT NULL COMMENT '目的地快照',
  `value_cent`   INT UNSIGNED    NOT NULL COMMENT '票面快照（分）',
  `highlight`    TEXT            NOT NULL COMMENT '亮点快照',
  `include_json` JSON            NOT NULL COMMENT '服务包含快照',
  `mood_text`    VARCHAR(255)    NOT NULL COMMENT '情绪文案快照',
  `badge_name`   VARCHAR(32)     NOT NULL COMMENT '解锁徽章名快照',
  `validity`     VARCHAR(16)     NOT NULL DEFAULT 'valid' COMMENT 'valid / invalid（退款后）',
  `diary_text`   TEXT            DEFAULT NULL COMMENT 'AI 旅行日记',
  `diary_at`     DATETIME(3)     DEFAULT NULL,
  `opened_date`  DATE            NOT NULL COMMENT '开盒日期，列表展示用',
  `created_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_user`     (`user_id`, `validity`, `opened_date`),
  KEY `idx_route`    (`route_id`),
  KEY `idx_location` (`location`),
  KEY `idx_valid_day`(`validity`, `opened_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='行程快照；客服只读查询';


-- ═══════════════════════════════════════════════════════
-- 3.10 聊天记录
-- ═══════════════════════════════════════════════════════
CREATE TABLE `chat_message` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`         BIGINT UNSIGNED NOT NULL,
  `conversation_id` VARCHAR(64)     NOT NULL COMMENT '登录用户 user:{id}；游客 guest:{sessionId} 不落库',
  `sender`          VARCHAR(8)      NOT NULL COMMENT 'user / ai / system',
  `content`         TEXT            NOT NULL,
  `via_quick`       TINYINT         NOT NULL DEFAULT 0 COMMENT '是否点了快捷问题',
  `token_in`        INT UNSIGNED    DEFAULT NULL COMMENT '输入 token 用量',
  `token_out`       INT UNSIGNED    DEFAULT NULL COMMENT '输出 token 用量',
  `fallback`        TINYINT         NOT NULL DEFAULT 0 COMMENT '1 表示走关键词降级，未调模型',
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_conv` (`conversation_id`, `created_at`),
  KEY `idx_user` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='小途对话流水';


-- ═══════════════════════════════════════════════════════
-- 3.11 画像摘要（P2）
-- ═══════════════════════════════════════════════════════
CREATE TABLE `user_ai_memory` (
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `summary`    TEXT            NOT NULL COMMENT '偏好摘要，注入系统上下文',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户 AI 画像摘要（P2 可选）';


-- ═══════════════════════════════════════════════════════
-- 3.12 AI 配置
-- ═══════════════════════════════════════════════════════
CREATE TABLE `ai_keyword_rule` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `keywords_json`     JSON            NOT NULL COMMENT '触发关键词数组',
  `reply_text`        VARCHAR(500)    NOT NULL COMMENT '命中后的固定回复',
  `recommend_box_ids` JSON            DEFAULT NULL COMMENT '随回复附带的推荐盲盒 id 数组',
  `sort_weight`       INT             NOT NULL DEFAULT 0 COMMENT '越大越先匹配',
  `status`            VARCHAR(8)      NOT NULL DEFAULT 'on',
  `created_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort_weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='模型不可用时的关键词降级规则';

CREATE TABLE `ai_default_reply` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `text`        VARCHAR(500)    NOT NULL COMMENT '无匹配时随机一条',
  `sort_weight` INT             NOT NULL DEFAULT 0,
  `status`      VARCHAR(8)      NOT NULL DEFAULT 'on',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort_weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='降级默认回复库';

CREATE TABLE `ai_quick_question` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `text`        VARCHAR(128)    NOT NULL COMMENT '用户端快捷问句',
  `sort_weight` INT             NOT NULL DEFAULT 0,
  `status`      VARCHAR(8)      NOT NULL DEFAULT 'on',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort_weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI 页快捷问题';

CREATE TABLE `diary_template` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content`     TEXT            NOT NULL COMMENT '占位 {线路名称} {目的地} {亮点}',
  `sort_weight` INT             NOT NULL DEFAULT 0,
  `status`      VARCHAR(8)      NOT NULL DEFAULT 'on',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort_weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='日记降级模板';


-- ═══════════════════════════════════════════════════════
-- 3.13 人格测试
-- ═══════════════════════════════════════════════════════
CREATE TABLE `personality_question` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seq`        INT             NOT NULL COMMENT '题号，从 1 开始',
  `stem`       VARCHAR(255)    NOT NULL COMMENT '题干',
  `status`     VARCHAR(8)      NOT NULL DEFAULT 'on',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_seq` (`seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='人格测试题目';

CREATE TABLE `personality_option` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `seq`         INT             NOT NULL COMMENT '选项序号，从 1 开始',
  `label`       VARCHAR(128)    NOT NULL COMMENT '选项文案',
  `score_json`  JSON            NOT NULL COMMENT '如 {"nature":2,"city":0}',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_question` (`question_id`, `seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='人格测试选项与计分';

CREATE TABLE `personality_result` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`        VARCHAR(32)     NOT NULL COMMENT 'nature / city / adventure / culture',
  `name`        VARCHAR(32)     NOT NULL COMMENT '如「山野治愈家」',
  `mark`        VARCHAR(4)      NOT NULL COMMENT '结果页圆形大字，如「野」',
  `description` VARCHAR(255)    NOT NULL DEFAULT '',
  `recommend`   VARCHAR(255)    NOT NULL DEFAULT '' COMMENT '推荐盲盒方向',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='人格结果定义';

CREATE TABLE `personality_test` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED DEFAULT NULL COMMENT '空表示游客结果未持久化',
  `result_type` VARCHAR(32)     NOT NULL,
  `score_json`  JSON            NOT NULL COMMENT '各维度得分',
  `answers_json` JSON           NOT NULL COMMENT '每题所选选项序号数组',
  `duration_ms` INT UNSIGNED    DEFAULT NULL COMMENT '作答耗时',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user`   (`user_id`, `created_at`),
  KEY `idx_result` (`result_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='人格测试作答记录';


-- ═══════════════════════════════════════════════════════
-- 3.14 心情日志
-- ═══════════════════════════════════════════════════════
CREATE TABLE `mood_log` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED DEFAULT NULL COMMENT '未登录可空，统计以登录用户为主',
  `mood`       VARCHAR(16)     NOT NULL COMMENT 'happy / emo / bored / curious',
  `box_id`     BIGINT UNSIGNED DEFAULT NULL COMMENT '选心情时是否连带筛选了盲盒',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_mood` (`mood`, `created_at`),
  KEY `idx_user` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='首页心情选择日志';


-- ═══════════════════════════════════════════════════════
-- 3.15 管理员
-- ═══════════════════════════════════════════════════════
CREATE TABLE `admin_user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(32)     NOT NULL COMMENT '登录名',
  `password_hash` VARCHAR(128)    NOT NULL COMMENT 'BCrypt，禁止明文/MD5',
  `display_name`  VARCHAR(32)     NOT NULL DEFAULT '' COMMENT '侧栏展示名',
  `role`          VARCHAR(16)     NOT NULL COMMENT 'super_admin / operator / cs / finance / analyst',
  `status`        VARCHAR(8)      NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `last_login_at` DATETIME(3)     DEFAULT NULL,
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理端账号';

CREATE TABLE `admin_audit_log` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`    BIGINT UNSIGNED NOT NULL,
  `action`      VARCHAR(32)     NOT NULL COMMENT 'refund_approve / refund_reject / user_disable / box_update / route_update / config_update',
  `target_type` VARCHAR(32)     NOT NULL COMMENT 'order / refund / user / box / route / config',
  `target_id`   VARCHAR(64)     NOT NULL,
  `detail_json` JSON            DEFAULT NULL COMMENT '变更前后摘要',
  `ip`          VARCHAR(45)     DEFAULT NULL COMMENT 'IPv4 / IPv6',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_admin`  (`admin_id`, `created_at`),
  KEY `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理端操作日志；退款审核/禁用用户/改价必记';


-- ═══════════════════════════════════════════════════════
-- 3.16 系统配置
-- ═══════════════════════════════════════════════════════
CREATE TABLE `sys_config` (
  `cfg_key`    VARCHAR(64)  NOT NULL,
  `cfg_value`  TEXT         NOT NULL COMMENT 'JSON 或标量',
  `remark`     VARCHAR(255) NOT NULL DEFAULT '' COMMENT '中文说明',
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`cfg_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统配置键值表；API Key 不进此表';


-- ═══════════════════════════════════════════════════════
-- 3.17 统计日表（P2）
-- ═══════════════════════════════════════════════════════
CREATE TABLE `stats_daily` (
  `stat_date`         DATE         NOT NULL,
  `new_users`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当日首次登录人数',
  `dau`               INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当日活跃去重：登录 ∪ 下单 ∪ 聊天 ∪ 测试',
  `box_open_count`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已开盒订单数',
  `gmv_cent`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '有效订单实付合计（分）',
  `pay_success_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '支付成功笔数',
  `pay_attempt_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '调起支付笔数',
  `refund_cent`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当日退款合计（分）',
  `refund_count`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当日退款单数',
  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统计日表；由定时任务汇总';


-- ═══════════════════════════════════════════════════════
-- 常用查询（对应管理端页面，放这里便于实现时抄）
-- ═══════════════════════════════════════════════════════

-- 开盒线路池：必须带 status='on' 且票面 ≥ 保底，否则开盒失败要退款
-- SELECT id, name, value_cent FROM travel_route
--  WHERE category = ? AND status = 'on' AND value_cent >= ?
--  ORDER BY RAND() LIMIT 1;

-- 扫超时未支付单（定时任务每分钟）
-- SELECT id, order_no FROM biz_order
--  WHERE status = 'pending_pay' AND expire_at < NOW(3) LIMIT 200;

-- 订单状态转已支付（notify 验签通过后，幂等靠 payment_flow.uk_notify_id）
-- UPDATE biz_order SET status='paid', paid_cent=?, paid_at=NOW(3), pay_channel='alipay'
--  WHERE order_no = ? AND status = 'pending_pay';

-- 重算盲盒开盒量（数据库设计 §7）
-- UPDATE blind_box b SET open_count = (
--   SELECT COUNT(*) FROM biz_order o WHERE o.box_id = b.id AND o.status = 'opened');

-- 重算线路抽中次数
-- UPDATE travel_route r SET draw_count = (
--   SELECT COUNT(*) FROM trip t WHERE t.route_id = r.id AND t.validity = 'valid');

-- 出货量 Top3（工作台热门货架）
-- SELECT b.id, b.name, b.open_count FROM blind_box b
--  WHERE b.status='on' ORDER BY b.open_count DESC LIMIT 3;

-- 退款构成（数据统计 · 退款构成）
-- SELECT kind, status, COUNT(*) c, SUM(amount_cent) amt
--   FROM refund_order WHERE created_at >= ? GROUP BY kind, status;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════════════
-- 新增功能：打卡、成就、社区、商家合作
-- 更新时间：2026-09-18
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════
-- N+1 盲盒奖品配置（支持门票/酒店/餐饮/文创）
-- ═══════════════════════════════════════════════════════
CREATE TABLE `blind_box_prize` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `blind_box_id`      BIGINT UNSIGNED NOT NULL COMMENT '关联盲盒',
  `prize_type`        VARCHAR(16)      NOT NULL COMMENT 'ticket-门票 / hotel-酒店 / meal-餐饮 / merchandise-文创 / badge-徽章 / coupon-优惠券',
  `prize_name`        VARCHAR(100)     NOT NULL COMMENT '奖品名称',
  `prize_value_cent`  INT UNSIGNED     NOT NULL COMMENT '奖品价值（分）',
  `quantity`          INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '库存数量，0表示无限',
  `probability`       DECIMAL(6,4)     NOT NULL COMMENT '中奖概率（0.0001-1.0000）',
  `partner_id`        BIGINT UNSIGNED  DEFAULT NULL COMMENT '关联商家ID',
  `description`       VARCHAR(255)     DEFAULT NULL COMMENT '奖品描述',
  `status`            VARCHAR(8)       NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `created_at`        DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_box`    (`blind_box_id`, `status`),
  KEY `idx_partner` (`partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='盲盒奖品配置';


-- ═══════════════════════════════════════════════════════
-- N+2 打卡记录
-- ═══════════════════════════════════════════════════════
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_trip` (`user_id`, `trip_id`),
  KEY `idx_user`   (`user_id`, `created_at`),
  KEY `idx_route`  (`route_id`),
  KEY `idx_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='景点打卡记录';


-- ═══════════════════════════════════════════════════════
-- N+3 成就定义
-- ═══════════════════════════════════════════════════════
CREATE TABLE `achievement` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`              VARCHAR(50)      NOT NULL COMMENT '成就代码',
  `name`              VARCHAR(50)      NOT NULL COMMENT '成就名称',
  `description`       VARCHAR(200)     DEFAULT NULL COMMENT '成就描述',
  `icon_url`          VARCHAR(500)     DEFAULT NULL COMMENT '成就图标',
  `requirement_type`  VARCHAR(50)      NOT NULL COMMENT 'checkin_count-打卡次数 / expense_sum-累计消费 / trip_count-行程数 / post_count-发帖数 / badge_count-徽章数',
  `requirement_value` INT UNSIGNED     NOT NULL COMMENT '达成阈值',
  `reward_type`       VARCHAR(50)      DEFAULT NULL COMMENT 'blind_box-盲盒 / coupon-优惠券 / badge-徽章',
  `reward_value`      VARCHAR(200)     DEFAULT NULL COMMENT '奖励内容（JSON或ID）',
  `level`             INT              NOT NULL DEFAULT 1 COMMENT '成就等级：1-青铜 2-白银 3-黄金 4-钻石 5-王者',
  `sort_weight`       INT              NOT NULL DEFAULT 0 COMMENT '排序权重',
  `status`            VARCHAR(8)       NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `created_at`        DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_type`    (`requirement_type`),
  KEY `idx_level`   (`level`, `sort_weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='成就定义';


-- ═══════════════════════════════════════════════════════
-- N+4 用户成就
-- ═══════════════════════════════════════════════════════
CREATE TABLE `user_achievement` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `achievement_id` BIGINT UNSIGNED NOT NULL COMMENT '成就ID',
  `progress`      INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '当前进度',
  `unlocked`      TINYINT         NOT NULL DEFAULT 0 COMMENT '是否已解锁：0-进行中 1-已解锁',
  `unlocked_at`   DATETIME(3)      DEFAULT NULL COMMENT '解锁时间',
  `reward_sent`   TINYINT          NOT NULL DEFAULT 0 COMMENT '奖励是否已发放',
  `created_at`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  KEY `idx_user_unlock` (`user_id`, `unlocked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户成就进度';


-- ═══════════════════════════════════════════════════════
-- N+5 社区帖子
-- ═══════════════════════════════════════════════════════
CREATE TABLE `community_post` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`            BIGINT UNSIGNED NOT NULL COMMENT '发帖用户',
  `content`            TEXT            NOT NULL COMMENT '帖子内容',
  `images`             VARCHAR(2000)   DEFAULT NULL COMMENT '多图URL，逗号分隔',
  `topic`              VARCHAR(50)     DEFAULT NULL COMMENT '话题标签，如：周末去哪儿',
  `location_tag`       VARCHAR(100)    DEFAULT NULL COMMENT '地点标签',
  `linked_blind_box_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联盲盒ID',
  `linked_checkin_id`  BIGINT UNSIGNED  DEFAULT NULL COMMENT '关联打卡ID',
  `linked_trip_id`     BIGINT UNSIGNED  DEFAULT NULL COMMENT '关联行程ID',
  `topic_id`            BIGINT UNSIGNED DEFAULT NULL COMMENT '关联启用话题',
  `like_count`         INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '点赞数',
  `comment_count`      INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '评论数',
  `share_count`        INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '分享数',
  `collect_count`      INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '收藏数',
  `status`             VARCHAR(8)       NOT NULL DEFAULT 'on' COMMENT 'on-正常 / off-下架 / deleted-已删除',
  `created_at`         DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`         DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user`      (`user_id`, `status`, `created_at`),
  KEY `idx_topic_id`  (`topic_id`, `created_at`),
  KEY `idx_like`      (`like_count`, `created_at`),
  KEY `idx_location`  (`location_tag`),
  KEY `idx_box`       (`linked_blind_box_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='社区帖子';


-- ═══════════════════════════════════════════════════════
-- N+6 帖子互动（点赞/评论/收藏）
-- ═══════════════════════════════════════════════════════
CREATE TABLE `post_interaction` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`         BIGINT UNSIGNED NOT NULL COMMENT '关联帖子',
  `user_id`         BIGINT UNSIGNED NOT NULL COMMENT '互动用户',
  `type`            VARCHAR(16)      NOT NULL COMMENT 'like-点赞 / comment-评论 / collect-收藏 / share-分享',
  `comment_content` VARCHAR(500)     DEFAULT NULL COMMENT '评论内容',
  `parent_id`       BIGINT UNSIGNED  DEFAULT NULL COMMENT '回复目标互动ID',
  `created_at`      DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  -- 同一用户对同一帖子只能点赞/收藏一次
  UNIQUE KEY `uk_post_user_collect` (`post_id`, `user_id`, `type`),
  KEY `idx_post`    (`post_id`, `type`),
  KEY `idx_user`    (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子互动（点赞/评论/收藏/分享）';


CREATE TABLE `post_comment` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`         BIGINT UNSIGNED NOT NULL,
  `user_id`         BIGINT UNSIGNED NOT NULL,
  `content`         VARCHAR(500) NOT NULL,
  `parent_id`       BIGINT UNSIGNED DEFAULT NULL,
  `created_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_comment_post` (`post_id`, `created_at`),
  KEY `idx_comment_user` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子评论';


-- ═══════════════════════════════════════════════════════
-- N+7 商家联盟
-- ═══════════════════════════════════════════════════════
CREATE TABLE `partner` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(100)     NOT NULL COMMENT '商家名称',
  `type`         VARCHAR(16)      NOT NULL COMMENT 'ticket-景点门票 / hotel-酒店民宿 / meal-餐饮美食 / merchandise-文创礼品',
  `contact`      VARCHAR(100)     DEFAULT NULL COMMENT '联系人',
  `phone`        VARCHAR(20)      DEFAULT NULL COMMENT '联系电话',
  `address`      VARCHAR(500)     DEFAULT NULL COMMENT '商家地址',
  `longitude`    DECIMAL(11,7)    DEFAULT NULL COMMENT '经度',
  `latitude`     DECIMAL(10,7)   DEFAULT NULL COMMENT '纬度',
  `description`  TEXT             DEFAULT NULL COMMENT '商家介绍',
  `logo_url`     VARCHAR(500)     DEFAULT NULL COMMENT '商家Logo',
  `images`       VARCHAR(2000)    DEFAULT NULL COMMENT '商家图片，逗号分隔',
  `business_hours` VARCHAR(100)   DEFAULT NULL COMMENT '营业时间',
  `commission_rate` DECIMAL(5,4)  NOT NULL DEFAULT 0.0500 COMMENT '佣金比例（默认5%）',
  `settlement_type` VARCHAR(16)   NOT NULL DEFAULT 'commission' COMMENT 'commission-佣金 / coupon-优惠券核销',
  `status`       VARCHAR(8)       NOT NULL DEFAULT 'pending' COMMENT 'pending-待审核 / on-合作中 / off-已结束',
  `reject_reason` VARCHAR(255)     DEFAULT NULL COMMENT '拒绝原因',
  `contract_start` DATE            DEFAULT NULL COMMENT '合作开始日期',
  `contract_end`   DATE            DEFAULT NULL COMMENT '合作结束日期',
  `total_orders`  INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '累计订单数',
  `total_amount_cent` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计成交金额（分）',
  `created_at`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_type`    (`type`, `status`),
  KEY `idx_status`  (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='商家联盟';


-- ═══════════════════════════════════════════════════════
-- N+8 优惠券
-- ═══════════════════════════════════════════════════════
CREATE TABLE `coupon` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`            VARCHAR(32)      NOT NULL COMMENT '优惠码',
  `name`            VARCHAR(100)     NOT NULL COMMENT '优惠券名称',
  `type`            VARCHAR(16)      NOT NULL COMMENT 'discount-折扣 / deduction-满减 / gift-赠品',
  `partner_id`      BIGINT UNSIGNED  DEFAULT NULL COMMENT '关联商家，NULL表示平台券',
  `discount_amount` INT UNSIGNED     DEFAULT NULL COMMENT '减免金额（分）',
  `min_order_amount` INT UNSIGNED   DEFAULT NULL COMMENT '最低消费金额（分）',
  `discount_rate`   DECIMAL(5,4)     DEFAULT NULL COMMENT '折扣率（如0.9表示9折）',
  `valid_days`      INT UNSIGNED     NOT NULL COMMENT '领取后有效天数',
  `total_count`     INT UNSIGNED     NOT NULL COMMENT '发放总量',
  `remain_count`    INT UNSIGNED     NOT NULL COMMENT '剩余数量',
  `status`          VARCHAR(8)       NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `created_at`      DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_partner` (`partner_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='优惠券';


-- ═══════════════════════════════════════════════════════
-- N+9 用户优惠券
-- ═══════════════════════════════════════════════════════
CREATE TABLE `user_coupon` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `coupon_id`     BIGINT UNSIGNED NOT NULL COMMENT '优惠券ID',
  `source`        VARCHAR(32)      NOT NULL COMMENT '来源：purchase-购买盲盒 / checkin-打卡 / achievement-成就 / partner-商家发放 / manual-手动领取',
  `source_id`     BIGINT UNSIGNED  DEFAULT NULL COMMENT '来源关联ID（如盲盒订单ID）',
  `order_id`      BIGINT UNSIGNED  DEFAULT NULL COMMENT '关联订单（消费时）',
  `status`        VARCHAR(8)       NOT NULL DEFAULT 'unused' COMMENT 'unused-未使用 / used-已使用 / expired-已过期',
  `obtained_at`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '领取时间',
  `valid_until`   DATETIME(3)      NOT NULL COMMENT '有效期截止',
  `used_at`       DATETIME(3)       DEFAULT NULL COMMENT '使用时间',
  `created_at`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`, `status`, `valid_until`),
  KEY `idx_coupon` (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户优惠券';


-- ═══════════════════════════════════════════════════════
-- N+10 话题广场
-- ═══════════════════════════════════════════════════════
CREATE TABLE `topic` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(50)      NOT NULL COMMENT '话题名称，如：周末去哪儿',
  `cover_url`     VARCHAR(500)     DEFAULT NULL COMMENT '话题封面',
  `description`   VARCHAR(255)     DEFAULT NULL COMMENT '话题描述',
  `post_count`    INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '帖子数量',
  `follow_count`  INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '关注人数',
  `热度权重`      INT              NOT NULL DEFAULT 0 COMMENT '热度计算权重',
  `status`        VARCHAR(8)       NOT NULL DEFAULT 'on' COMMENT 'on / off',
  `sort_weight`   INT              NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_status_weight` (`status`, `sort_weight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='社区话题';


-- ═══════════════════════════════════════════════════════
-- N+11 用户话题关注
-- ═══════════════════════════════════════════════════════
CREATE TABLE `user_topic_follow` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `topic_id`   BIGINT UNSIGNED NOT NULL COMMENT '话题ID',
  `created_at` DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_topic` (`user_id`, `topic_id`),
  KEY `idx_topic` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户话题关注';


-- ═══════════════════════════════════════════════════════
-- N+12 打卡点赞（独立表，便于统计）
-- ═══════════════════════════════════════════════════════
CREATE TABLE `checkin_like` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `checkin_id` BIGINT UNSIGNED NOT NULL COMMENT '打卡ID',
  `user_id`    BIGINT UNSIGNED NOT NULL COMMENT '点赞用户',
  `created_at` DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_checkin_user` (`checkin_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='打卡点赞';


-- ═══════════════════════════════════════════════════════
-- N+13 积分表
-- ═══════════════════════════════════════════════════════
CREATE TABLE `user_point` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `balance`      INT              NOT NULL DEFAULT 0 COMMENT '当前积分余额',
  `total_earned` INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '累计获得积分',
  `total_spent`  INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '累计消耗积分',
  `created_at`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户积分账户';


-- ═══════════════════════════════════════════════════════
-- N+14 积分变动记录
-- ═══════════════════════════════════════════════════════
CREATE TABLE `point_log` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `change`      INT              NOT NULL COMMENT '变动数量（正数为获得，负数为消耗）',
  `balance_after` INT             NOT NULL COMMENT '变动后余额',
  `type`        VARCHAR(32)      NOT NULL COMMENT 'checkin-打卡 / achievement-成就 / order-订单 / exchange-兑换 / signin-签到',
  `biz_id`      BIGINT UNSIGNED  DEFAULT NULL COMMENT '关联业务ID',
  `description` VARCHAR(255)     DEFAULT NULL COMMENT '描述',
  `created_at`  DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`, `created_at`),
  KEY `idx_type` (`type`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='积分变动记录';
