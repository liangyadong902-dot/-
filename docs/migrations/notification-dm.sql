-- 消息通知 + 私信（2026-09）
-- 在 tuge 库执行；幂等：仅首次创建

CREATE TABLE IF NOT EXISTS `notification` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL COMMENT '接收人',
  `type`        VARCHAR(16)     NOT NULL COMMENT 'like / comment / reply / follow / system',
  `actor_id`    BIGINT UNSIGNED DEFAULT NULL COMMENT '触发者用户 ID',
  `post_id`     BIGINT UNSIGNED DEFAULT NULL COMMENT '关联帖子',
  `comment_id`  BIGINT UNSIGNED DEFAULT NULL COMMENT '关联评论',
  `content`     VARCHAR(255)    DEFAULT NULL COMMENT '摘要文本',
  `is_read`     TINYINT         NOT NULL DEFAULT 0,
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`, `is_read`, `id`),
  KEY `idx_actor` (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='站内消息通知';

CREATE TABLE IF NOT EXISTS `dm_conversation` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_low_id`     BIGINT UNSIGNED NOT NULL COMMENT '会话双方中较小的用户 ID',
  `user_high_id`    BIGINT UNSIGNED NOT NULL COMMENT '会话双方中较大的用户 ID',
  `last_message`    VARCHAR(500)    DEFAULT NULL COMMENT '最近一条消息摘要',
  `last_sender_id`  BIGINT UNSIGNED DEFAULT NULL,
  `last_message_at` DATETIME(3)     DEFAULT NULL,
  `low_unread`      INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'user_low_id 未读数',
  `high_unread`     INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'user_high_id 未读数',
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pair` (`user_low_id`, `user_high_id`),
  KEY `idx_low_time` (`user_low_id`, `last_message_at`),
  KEY `idx_high_time` (`user_high_id`, `last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='私信会话';

CREATE TABLE IF NOT EXISTS `dm_message` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender_id`       BIGINT UNSIGNED NOT NULL,
  `content`         VARCHAR(500)    NOT NULL,
  `is_read`         TINYINT         NOT NULL DEFAULT 0,
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_conv` (`conversation_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='私信消息';
