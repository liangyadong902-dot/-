CREATE TABLE IF NOT EXISTS `ai_conversation` (
  `id`            VARCHAR(64)     NOT NULL COMMENT '服务端生成的会话标识',
  `user_id`       BIGINT UNSIGNED NOT NULL,
  `title`         VARCHAR(64)     NOT NULL DEFAULT '新对话',
  `last_message`  VARCHAR(255)    NOT NULL DEFAULT '',
  `message_count` INT UNSIGNED    NOT NULL DEFAULT 0,
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user_updated` (`user_id`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI 持久化会话';

INSERT INTO `ai_conversation` (`id`, `user_id`, `title`, `last_message`, `message_count`, `created_at`, `updated_at`)
SELECT cm.`conversation_id`, cm.`user_id`,
       LEFT(COALESCE((SELECT u.`content` FROM `chat_message` u
                      WHERE u.`user_id` = cm.`user_id` AND u.`conversation_id` = cm.`conversation_id` AND u.`sender` = 'user'
                      ORDER BY u.`created_at`, u.`id` LIMIT 1), '最近对话'), 64),
       LEFT((SELECT l.`content` FROM `chat_message` l
             WHERE l.`user_id` = cm.`user_id` AND l.`conversation_id` = cm.`conversation_id`
             ORDER BY l.`created_at` DESC, l.`id` DESC LIMIT 1), 255),
       COUNT(*), MIN(cm.`created_at`), MAX(cm.`created_at`)
FROM `chat_message` cm
GROUP BY cm.`conversation_id`, cm.`user_id`
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`), `last_message` = VALUES(`last_message`),
  `message_count` = VALUES(`message_count`), `updated_at` = VALUES(`updated_at`);

UPDATE `travel_route`
SET `guide_json` = JSON_SET(`guide_json`,
  '$.paceText', CASE `category` WHEN 'nearby' THEN '轻松慢游' WHEN 'province' THEN '舒展深度' WHEN 'cross' THEN '松弛探索' ELSE '边走边尝' END,
  '$.walkText', CASE `category` WHEN 'nearby' THEN '6–9 千步' WHEN 'province' THEN '约 1.2 万步/天' WHEN 'cross' THEN '8–12 千步/天' ELSE '8–10 千步' END,
  '$.transitText', CASE `category` WHEN 'nearby' THEN '集合接驳' WHEN 'province' THEN '大巴往返' WHEN 'cross' THEN '大交通自理' ELSE '城市公共交通' END,
  '$.season', CASE `category` WHEN 'nearby' THEN '四季可行' WHEN 'province' THEN '春秋最佳' WHEN 'cross' THEN '以目的地季节为准' ELSE '全年适合' END,
  '$.weather', JSON_OBJECT('title','天气与穿着','description','出发前请以目的地实时预报为准；雨天准备防滑鞋和轻便雨具，昼夜温差较大时携带外套。'),
  '$.facts', JSON_ARRAY(
    JSON_OBJECT('label','线路类型','value', CASE `category` WHEN 'nearby' THEN '周边短途' WHEN 'province' THEN '省内深度' WHEN 'cross' THEN '跨省旅行' ELSE '主题体验' END),
    JSON_OBJECT('label','行程节奏','value', CASE `category` WHEN 'nearby' THEN '轻松慢游' WHEN 'province' THEN '舒展深度' WHEN 'cross' THEN '松弛探索' ELSE '边走边尝' END),
    JSON_OBJECT('label','步行强度','value', CASE `category` WHEN 'nearby' THEN '6–9 千步' WHEN 'province' THEN '约 1.2 万步/天' WHEN 'cross' THEN '8–12 千步/天' ELSE '8–10 千步' END),
    JSON_OBJECT('label','主要交通','value', CASE `category` WHEN 'nearby' THEN '集合接驳' WHEN 'province' THEN '大巴往返' WHEN 'cross' THEN '大交通自理' ELSE '城市公共交通' END)),
  '$.rules', JSON_ARRAY(JSON_OBJECT('title','预约与集合','description','出发前一天确认最终集合点、领队与车辆信息。'), JSON_OBJECT('title','行程变更','description','如遇天气或景区临时调整，以订单通知和安全优先原则处理。')));
UPDATE `trip` t JOIN `travel_route` r ON r.`id` = t.`route_id`
SET t.`guide_snapshot_json` = JSON_MERGE_PATCH(r.`guide_json`, COALESCE(t.`guide_snapshot_json`, JSON_OBJECT())),
    t.`guide_version` = COALESCE(r.`guide_version`, 1);
