-- 途个惊喜 · 种子数据
-- 产品数据以 prototype/index.html 为准（7 盲盒、10 线路、价格地名禁止手改）
-- 视觉角标 / 封面仅作演示，不改售价与目的地
--
-- 执行：
--   mysql -uroot -p < docs/schema.sql
--   mysql -uroot -p tuge < docs/seed.sql
--
-- 分两部分：
--   A. 配置种子（必须，没内容无法演示）
--   B. 演示数据（可选；正式部署可整段删掉）

SET NAMES utf8mb4;
SET time_zone = '+08:00';

USE `tuge`;

-- ═══════════════════════════════════════════════════════
-- A. 配置种子
-- ═══════════════════════════════════════════════════════

-- ── A1. 徽章 12 枚（mark = 用户端圆形印章字） ──
DELETE FROM `user_badge`;
DELETE FROM `badge`;
INSERT INTO `badge` (`id`, `name`, `mark`, `description`, `sort_weight`) VALUES
  (1,  '古村', '村', '青石古街与老樟树',     90),
  (2,  '山野', '山', '徒步、云海与草甸',     80),
  (3,  '美食', '味', '街角早茶与烟火气',     70),
  (4,  '徽派', '徽', '白墙黛瓦与晒秋',       60),
  (5,  '文艺', '文', '陶艺、书店与手作',     50),
  (6,  '海滨', '海', '海浪、船票与日落',     40),
  (7,  '红色', '红', '革命旧址与研学',       35),
  (8,  '乡村', '乡', '农事体验与帮扶村落',   30),
  (9,  '探险', '探', '未知路线与挑战',       25),
  (10, '露营', '营', '星空、篝火与帐篷',     20),
  (11, '研学', '学', '非遗与人文实践',       15),
  (12, '摄影', '影', '为出片而出发',         10);

-- ── A2. 线路池（prototype/index.html routes） ──
-- 保底校验（同分类启用线路须盖过盲盒 min_value_cent）：
--   nearby   99/120、89/110、259/320 → 158/188/136/328 元
--   province 299/360                 → 458/398 元
--   cross    999/1200                → 1480/1350 元
--   theme    199/240、159/190        → 268/258 元
DELETE FROM `travel_route`;
INSERT INTO `travel_route`
  (`id`, `name`, `category`, `location`, `value_cent`, `cost_cent`, `badge_id`,
   `highlight`, `include_json`, `mood_text`, `status`) VALUES
  (1, '渼陂古村非遗体验一日游', 'nearby',   '吉安 · 青原区',  15800, NULL, 1,
      '探访千年庐陵古村，体验油纸伞非遗制作，品尝地道农家宴席。',
      CAST('["往返大巴","非遗体验","农家午餐","向导讲解","意外险"]' AS JSON),
      '古村的风会吹走所有烦恼', 'on'),
  (2, '武功山轻徒步一日线',     'nearby',   '萍乡 · 武功山',  18800, NULL, 2,
      '精选轻徒步路线，高山草甸绝美风光，新手友好无压力。',
      CAST('["往返大巴","登山向导","登山杖","意外险"]' AS JSON),
      '去山顶，把烦恼喊给风听', 'on'),
  (3, '赣江古镇美食探店',       'nearby',   '吉安 · 永和镇',  13600, NULL, 3,
      '逛千年吉州窑遗址，吃遍本地特色小吃，打卡网红书店。',
      CAST('["往返交通","美食基金","讲解耳机","意外险"]' AS JSON),
      '美食和风景，都不可辜负', 'on'),
  (4, '星空露营山野夜',         'nearby',   '吉安 · 大冈山',  32800, NULL, 10,
      '远离城市灯光，在山野里看银河星空，篝火旁聊天唱歌。',
      CAST('["往返交通","露营装备","烧烤晚餐","星空讲解"]' AS JSON),
      '星空下，你不需要很坚强', 'on'),
  (5, '婺源篁岭晒秋两日游',     'province', '上饶 · 婺源',    45800, NULL, 4,
      '秋日限定晒秋景观，入住古村民宿，清晨漫步无人石板路。',
      CAST('["往返高铁","民宿住宿","景区门票","早餐","向导"]' AS JSON),
      '慢下来，生活本来就该很美', 'on'),
  (6, '景德镇陶艺深度体验',     'province', '景德镇 · 三宝村',39800, NULL, 5,
      '三宝国际陶艺村驻场体验，亲手拉坯烧制，逛小众博物馆。',
      CAST('["往返交通","陶艺体验","民宿一晚","烧制邮费"]' AS JSON),
      '亲手做的礼物，最有温度', 'on'),
  (7, '厦门鼓浪屿三日慢游',     'cross',    '福建 · 厦门',   148000, NULL, 6,
      '慢节奏海岛生活，避开人流打卡小众机位，吃遍闽南美食。',
      CAST('["往返机票","海景酒店","船票","半自由行"]' AS JSON),
      '海的那边，是新的开始', 'on'),
  (8, '长沙美食特种兵之旅',     'cross',    '湖南 · 长沙',   135000, NULL, 3,
      '三天吃遍长沙老字号，打卡网红地标，住五一广场核心区。',
      CAST('["往返高铁","市中心酒店","美食攻略","意外险"]' AS JSON),
      '快乐就是，吃很多很多好吃的', 'on'),
  (9, '井冈山红色研学两日行',   'theme',    '吉安 · 井冈山',  26800, NULL, 7,
      '重走红军路，参观革命旧址，沉浸式红色文化学习。',
      CAST('["往返大巴","景区门票","讲解服务","住宿餐饮"]' AS JSON),
      '以史为鉴，奔赴更好的未来', 'on'),
  (10,'坝上村乡村治愈之旅',     'theme',    '吉安 · 坝上村',  25800, NULL, 8,
      '深入帮扶村落，参与农事体验，助力乡村文旅发展。',
      CAST('["往返交通","农家食宿","实践证书","公益捐赠"]' AS JSON),
      '回到田野，回到最初的自己', 'on');

-- ── A3. 盲盒 7 个 + 心情（prototype/index.html blindBoxes） ──
DELETE FROM `blind_box_mood`;
DELETE FROM `blind_box`;
INSERT INTO `blind_box`
  (`id`, `name`, `category`, `tag`, `rank_tag`, `intro`, `price_cent`, `min_value_cent`,
   `cover_url`, `sort_weight`, `status`) VALUES
  (1, '周边微度假盲盒', 'nearby',   '周边游',   'TOP1', '1天短途 · 周末说走就走',
      9900,  12000, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80', 90, 'on'),
  (2, '省内深度游盲盒', 'province', '省内游',   'HOT',  '2天1晚 · 解锁小众秘境',
      29900, 36000, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 80, 'on'),
  (3, '跨省限定盲盒',   'cross',    '跨省游',   'NEW',  '3-4天 · 远方不期而遇',
      99900, 120000,'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', 70, 'on'),
  (4, '乡村治愈主题盲盒','theme',   '主题专线', NULL,   '古村慢生活 · 治愈emo',
      19900, 24000, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 60, 'on'),
  (5, '红色研学盲盒',   'theme',    '主题专线', NULL,   '井冈山线路 · 研学实践',
      15900, 19000, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 50, 'on'),
  (6, '城市探店盲盒',   'nearby',   '周边游',   'TOP2', '本地美食 · 宝藏小店',
      8900,  11000, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 40, 'on'),
  (7, '山野露营盲盒',   'nearby',   '周边游',   'TOP3', '星空露营 · 逃离城市',
      25900, 32000, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 30, 'on');

INSERT INTO `blind_box_mood` (`box_id`, `mood`) VALUES
  (1, 'happy'), (1, 'bored'),
  (2, 'curious'), (2, 'bored'),
  (3, 'curious'), (3, 'happy'),
  (4, 'emo'),
  (5, 'curious'),
  (6, 'happy'), (6, 'bored'),
  (7, 'emo'), (7, 'bored');

-- ── A4. 运营位 ──
DELETE FROM `banner`;
INSERT INTO `banner`
  (`id`, `title`, `subtitle`, `tag_text`, `image_url`, `jump_type`, `jump_value`, `sort_weight`, `status`) VALUES
  (1, '暑期限定盲盒上线', '全系列票面价值保底120%', '价值保底',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      'none', NULL, 90, 'on'),
  (2, 'emo 日专场', '乡村治愈与山野露营，把皱抚平', '心情匹配',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
      'none', NULL, 80, 'on');

-- ── A5. 人格测试（题干/选项文案与原型一致；计分只累加四类人格，避免 quiet 等杂维抢最高分） ──
DELETE FROM `personality_option`;
DELETE FROM `personality_question`;
INSERT INTO `personality_question` (`id`, `seq`, `stem`) VALUES
  (1, 1, '周末有空你更倾向于？'),
  (2, 2, '旅行时你最看重什么？'),
  (3, 3, '心情不好你会怎么调节？'),
  (4, 4, '你喜欢什么样的旅行节奏？'),
  (5, 5, '你理想的旅行伙伴是？');

INSERT INTO `personality_option` (`question_id`, `seq`, `label`, `score_json`) VALUES
  (1, 1, '宅家躺平，哪儿也不想去', CAST('{"nature":2}' AS JSON)),
  (1, 2, '约朋友逛街吃美食',       CAST('{"city":2}' AS JSON)),
  (1, 3, '去周边爬爬山逛公园',     CAST('{"nature":3}' AS JSON)),
  (1, 4, '打卡网红景点拍照',       CAST('{"city":2}' AS JSON)),
  (2, 1, '风景好，人少安静',       CAST('{"nature":3}' AS JSON)),
  (2, 2, '美食多，吃得开心',       CAST('{"city":2}' AS JSON)),
  (2, 3, '有文化底蕴，能涨见识',   CAST('{"culture":3}' AS JSON)),
  (2, 4, '刺激好玩，有挑战性',     CAST('{"adventure":2}' AS JSON)),
  (3, 1, '找个没人的地方发呆',     CAST('{"nature":1}' AS JSON)),
  (3, 2, '大吃一顿治愈自己',       CAST('{"city":1}' AS JSON)),
  (3, 3, '出去走走散散心',         CAST('{"nature":2}' AS JSON)),
  (3, 4, '找朋友聊天吐槽',         CAST('{"city":1}' AS JSON)),
  (4, 1, '慢节奏，睡到自然醒',     CAST('{"nature":1}' AS JSON)),
  (4, 2, '紧凑点，多逛几个地方',   CAST('{"city":2}' AS JSON)),
  (4, 3, '随心所欲，走到哪算哪',   CAST('{"adventure":3}' AS JSON)),
  (4, 4, '提前做好详细攻略',       CAST('{"culture":2}' AS JSON)),
  (5, 1, '独自一人，享受自由',     CAST('{"adventure":2}' AS JSON)),
  (5, 2, '和最好的朋友一起',       CAST('{"city":1}' AS JSON)),
  (5, 3, '和家人一起',             CAST('{"culture":2}' AS JSON)),
  (5, 4, '认识新朋友也不错',       CAST('{"adventure":2}' AS JSON));

DELETE FROM `personality_result`;
INSERT INTO `personality_result` (`id`, `type`, `name`, `mark`, `description`, `recommend`) VALUES
  (1, 'nature',    '山野治愈家', '野', '你偏爱安静自然的旅行，在山水间找回内心的平静。',
      '山野徒步、古村慢游、露营观星类盲盒最适合你'),
  (2, 'city',      '城市探险家', '城', '你热爱城市的烟火气，在美食与探店中收获快乐。',
      '城市探店、美食专线、都市潮玩类盲盒最适合你'),
  (3, 'adventure', '追风冒险者', '风', '你喜欢未知与挑战，永远对下一站充满期待。',
      '跨省限定、户外探险、小众秘境类盲盒最适合你'),
  (4, 'culture',   '人文记录者', '文', '你钟情于历史与文化，在旅途中探索精神的厚度。',
      '红色研学、非遗体验、古镇人文类盲盒最适合你');

-- ── A6. 小途：快捷问题 / 降级话术 / 默认回复 / 日记模板 ──
DELETE FROM `ai_quick_question`;
INSERT INTO `ai_quick_question` (`text`, `sort_weight`, `status`) VALUES
  ('推荐散心的地方',   90, 'on'),
  ('周末一日游推荐',   80, 'on'),
  ('一个人旅行安全吗', 70, 'on');

DELETE FROM `ai_keyword_rule`;
INSERT INTO `ai_keyword_rule` (`keywords_json`, `reply_text`, `recommend_box_ids`, `sort_weight`, `status`) VALUES
  (CAST('["散心","不好","emo"]' AS JSON),
   '如果想散心的话，特别推荐「乡村治愈主题盲盒」或者「山野露营盲盒」～远离城市喧嚣，在古村或者山野待上一天，坏情绪会慢慢被治愈的。',
   CAST('[4,7]' AS JSON), 90, 'on'),
  (CAST('["周末","一日游"]' AS JSON),
   '周末一日游的话，周边微度假盲盒超合适！不用提前做攻略，说走就走，古村探秘、美食探店、轻徒步都有满满的惊喜感。',
   CAST('[1]' AS JSON), 80, 'on'),
  (CAST('["一个人","安全"]' AS JSON),
   '一个人旅行超酷的！我们的盲盒线路都很安全，一个人反而更自由，还能在路上认识新朋友。担心孤单的话随时找我聊天。',
   CAST('[1]' AS JSON), 70, 'on');

DELETE FROM `ai_default_reply`;
INSERT INTO `ai_default_reply` (`text`, `sort_weight`, `status`) VALUES
  ('其实旅行的意义，就是从熟悉的生活里暂时逃开，去遇见新的风景和新的自己呀', 90, 'on'),
  ('不如就开个盲盒吧！把选择权交给运气，说不定会遇见意想不到的惊喜呢～',     80, 'on'),
  ('开心也是一天，不开心也是一天，不如收拾收拾出发呀，路上的风会治愈一切的', 70, 'on'),
  ('我一直都在哦，不管是想聊旅行，还是想吐槽发泄，都可以跟我说～',           60, 'on');

DELETE FROM `diary_template`;
INSERT INTO `diary_template` (`content`, `sort_weight`, `status`) VALUES
  ('今天去了{目的地}的{线路名称}，风是温柔的，阳光是刚好的。不用刻意规划的旅途，反而遇见了最多的惊喜。', 90, 'on'),
  ('很庆幸开了这个盲盒，遇见了{线路名称}。在{目的地}的时光像被放慢了一样，不用赶时间，只是安安静静感受当下。', 80, 'on'),
  ('今日份快乐来自{线路名称}。{目的地}比想象中还要美，吃到了好吃的，看到了好看的风景。', 70, 'on');

-- ── A7. 系统配置 ──
DELETE FROM `sys_config`;
INSERT INTO `sys_config` (`cfg_key`, `cfg_value`, `remark`) VALUES
  ('pay.timeout_minutes',    '15',     '待支付超时（分钟）'),
  ('pay.alipay.enabled',     'true',   '支付宝渠道开关'),
  ('pay.alipay.sandbox',     'true',   '是否沙箱环境'),
  ('pay.alipay.product',     'page',   'page 电脑网站 / wap 手机网站 / auto 按 UA'),
  ('pay.mock_enabled',       'false',  '无沙箱密钥时的本地模拟支付，默认关'),
  ('welfare.yuan_per_order', '1',      '每单提取的乡村文旅扶持金（元）'),
  ('level.rules',            '[[0,2,"旅行新手"],[3,7,"探索者"],[8,99,"旅行家"]]', '出行次数 → 称号'),
  ('ai.memory.window',       '16',     '短期记忆条数'),
  ('ai.timeout_ms',          '12000',  '模型调用超时'),
  ('ai.tools.enabled',       'true',   '是否启用 Tool 查询上架盲盒'),
  ('ai.rag.enabled',         'false',  '第一期用 Tool 代替 RAG'),
  ('ai.fallback.keyword',    'true',   '模型失败时走关键词降级'),
  ('ai.welcome',             '嗨～我是你的旅行搭子小途，不知道去哪玩都可以问我哦！', 'AI 页开场白'),
  ('ai.system_prompt',       '你是途个惊喜的旅行搭子小途。自称小途，语气轻松，不说自己是模型。推荐只能来自当前上架盲盒，价格和保底以工具返回为准。不承诺一定抽到某条线路。不处理退款审核，引导去「我的 → 订单」。涉及安全时强调官方线路含向导/交通，不鼓励盲目穷游。禁止虚构价格，禁止替用户开盒或支付。', '小途人设'),
  ('ai.diary_prompt',        '根据 {线路名称}、{目的地}、{亮点} 写一段第一人称短文旅行日记，像手写在纸上，不要虚构未出现的地点。', '旅行日记 Prompt'),
  ('copy.value_guard',       '票面价值不低于售价 120%，符合保障规则可申请退换。', '「我的」服务说明 1'),
  ('copy.mood_match',        '基于心情智能匹配旅行主题与线路。', '「我的」服务说明 2'),
  ('copy.village',           '每售出 1 份盲盒提取 1 元纳入扶持金。', '「我的」服务说明 3'),
  ('badge.total',            '12',     '徽章总数，用户端进度分母');

-- ── A8. 管理端账号（演示密码均为 tuge，正式环境必须改） ──
-- BCrypt(10) of "tuge"
DELETE FROM `admin_audit_log`;
DELETE FROM `admin_user`;
INSERT INTO `admin_user` (`id`, `username`, `password_hash`, `display_name`, `role`, `status`) VALUES
  (1, 'admin',    '$2a$10$j9.fFDe10p41dwa.TYDEV.y.9IsRsQ/CPIfcehvUxbM50skIN4Im2', '林烘烘', 'super_admin', 'on'),
  (2, 'operator', '$2a$10$j9.fFDe10p41dwa.TYDEV.y.9IsRsQ/CPIfcehvUxbM50skIN4Im2', '阿厨',   'operator',    'on'),
  (3, 'cs',       '$2a$10$j9.fFDe10p41dwa.TYDEV.y.9IsRsQ/CPIfcehvUxbM50skIN4Im2', '小接待', 'cs',          'on'),
  (4, 'finance',  '$2a$10$j9.fFDe10p41dwa.TYDEV.y.9IsRsQ/CPIfcehvUxbM50skIN4Im2', '账房',   'finance',     'on'),
  (5, 'analyst',  '$2a$10$j9.fFDe10p41dwa.TYDEV.y.9IsRsQ/CPIfcehvUxbM50skIN4Im2', '看数的', 'analyst',     'on');


-- ═══════════════════════════════════════════════════════
-- B. 演示数据（可选）
-- 再跑一遍本文件前会先清这些表，避免主键冲突
-- ═══════════════════════════════════════════════════════

DELETE FROM `payment_flow`;
DELETE FROM `refund_order`;
DELETE FROM `trip`;
DELETE FROM `biz_order`;
DELETE FROM `chat_message`;
DELETE FROM `mood_log`;
DELETE FROM `personality_test`;
DELETE FROM `user_badge`;
DELETE FROM `stats_daily`;
DELETE FROM `app_user`;

-- ── B1. 演示用户 ──
INSERT INTO `app_user`
  (`id`, `phone`, `nickname`, `register_channel`, `status`, `last_mood`, `personality_type`,
   `last_login_at`, `last_active_at`, `avatar_url`) VALUES
  (10021, '13800001201', '小鹿', 'phone',  'normal', 'emo',     'nature',
   '2026-09-17 08:12:00.000', '2026-09-17 08:12:00.000', ''),
  (10044, '13900008830', '阿茶', 'wechat', 'normal', 'curious', 'culture',
   '2026-09-17 09:40:00.000', '2026-09-17 09:40:00.000', ''),
  (10007, '13600004412', '北北', 'phone',  'normal', 'happy',   'adventure',
   '2026-09-17 10:05:00.000', '2026-09-17 10:05:00.000', ''),
  (10058, '15000009921', '林深', 'wechat', 'normal', 'bored',   'city',
   '2026-09-16 21:18:00.000', '2026-09-16 21:18:00.000', ''),
  (10063, '18700006608', '米粒', 'phone',  'normal', 'happy',   NULL,
   '2026-09-17 11:22:00.000', '2026-09-17 11:22:00.000', '');

-- ── B2. 订单（覆盖 5 种状态；金额/盲盒名与 A3 一致） ──
INSERT INTO `biz_order`
  (`id`, `order_no`, `user_id`, `box_id`, `box_name`, `box_category`, `price_cent`, `paid_cent`,
   `min_value_cent`, `status`, `pay_channel`, `expire_at`, `paid_at`, `opened_at`, `cancelled_at`,
   `route_id`, `trip_id`, `created_at`) VALUES
  (1, 'T20260917001', 10021, 1, '周边微度假盲盒',   'nearby',    9900,  9900,  12000, 'opened',
      'alipay', '2026-09-17 08:27:00.000', '2026-09-17 08:14:00.000', '2026-09-17 08:14:05.000', NULL, 1, 1, '2026-09-17 08:12:00.000'),
  (2, 'T20260917002', 10044, 2, '省内深度游盲盒',   'province', 29900,     0,  36000, 'pending_pay',
      NULL,     '2026-09-17 09:55:00.000', NULL, NULL, NULL, NULL, NULL, '2026-09-17 09:40:00.000'),
  (3, 'T20260917003', 10007, 7, '山野露营盲盒',     'nearby',   25900, 25900,  32000, 'opened',
      'alipay', '2026-09-17 10:20:00.000', '2026-09-17 10:07:00.000', '2026-09-17 10:07:06.000', NULL, 4, 2, '2026-09-17 10:05:00.000'),
  (4, 'T20260917004', 10058, 3, '跨省限定盲盒',     'cross',    99900, 99900, 120000, 'refunded',
      'alipay', '2026-09-16 21:33:00.000', '2026-09-16 21:20:00.000', NULL, NULL, NULL, NULL, '2026-09-16 21:18:00.000'),
  (5, 'T20260917005', 10063, 6, '城市探店盲盒',     'nearby',    8900,  8900,  11000, 'opened',
      'alipay', '2026-09-17 11:37:00.000', '2026-09-17 11:24:00.000', '2026-09-17 11:24:06.000', NULL, 3, 3, '2026-09-17 11:22:00.000'),
  (6, 'T20260917006', 10044, 4, '乡村治愈主题盲盒', 'theme',    19900,     0,  24000, 'cancelled',
      NULL,     '2026-09-16 19:17:00.000', NULL, NULL, '2026-09-16 19:17:30.000', NULL, NULL, '2026-09-16 19:02:00.000'),
  (7, 'T20260917007', 10063, 1, '周边微度假盲盒',   'nearby',    9900,  9900,  12000, 'paid',
      'alipay', '2026-09-17 12:05:00.000', '2026-09-17 11:52:00.000', NULL, NULL, NULL, NULL, '2026-09-17 11:50:00.000');

-- ── B3. 支付流水 ──
INSERT INTO `payment_flow` (`id`, `flow_no`, `order_id`, `order_no`, `channel`, `channel_trade_no`, `amount_cent`, `result`, `notify_id`) VALUES
  (1, 'F20260917001', 1, 'T20260917001', 'alipay', '2026091722001400000001',  9900, 'success', 'N2026091700001'),
  (2, 'F20260917002', 3, 'T20260917003', 'alipay', '2026091722001400000002', 25900, 'success', 'N2026091700002'),
  (3, 'F20260917003', 4, 'T20260917004', 'alipay', '2026091722001400000003', 99900, 'success', 'N2026091700003'),
  (4, 'F20260917004', 5, 'T20260917005', 'alipay', '2026091722001400000004',  8900, 'success', 'N2026091700004'),
  (5, 'F20260917005', 7, 'T20260917007', 'alipay', '2026091722001400000005',  9900, 'success', 'N2026091700005'),
  (6, 'F20260917006', 2, 'T20260917002', 'alipay', NULL,                     29900, 'fail',    NULL);

-- ── B4. 退款单 ──
-- 订单 4：演示抽奖失败自动退（当前线路池实际能盖过保底，此单只为状态机展示）
INSERT INTO `refund_order`
  (`id`, `refund_no`, `order_id`, `order_no`, `user_id`, `amount_cent`, `reason`, `kind`, `status`,
   `channel_refund_no`, `reviewer_id`, `reject_reason`, `reviewed_at`) VALUES
  (1, 'R20260917001', 4, 'T20260917004', 10058, 99900, '池中无线路满足保底',    'draw_fail',   'auto',
      '2026091722001400000099', NULL, NULL, NULL),
  (2, 'R20260917002', 1, 'T20260917001', 10021,  9900, '未出行退换 · 行程冲突', 'unused',      'pending_review',
      NULL, NULL, NULL, NULL),
  (3, 'R20260917003', 3, 'T20260917003', 10007, 25900, '计划变更',             'unused',      'pending_review',
      NULL, NULL, NULL, NULL),
  (4, 'R20260916008', 1, 'T20260917001', 10021,  9900, '重复申请',             'unused',      'rejected',
      NULL, 1, '已超出可退期限', '2026-09-16 18:00:00.000');

-- ── B5. 行程（仅 valid；退款通过后才会变 invalid） ──
INSERT INTO `trip`
  (`id`, `user_id`, `order_id`, `route_id`, `box_id`, `box_name`, `box_category`, `price_cent`,
   `route_name`, `location`, `value_cent`, `highlight`, `include_json`, `mood_text`, `badge_name`,
   `validity`, `opened_date`, `created_at`) VALUES
  (1, 10021, 1, 1, 1, '周边微度假盲盒', 'nearby',  9900,
      '渼陂古村非遗体验一日游', '吉安 · 青原区', 15800,
      '探访千年庐陵古村，体验油纸伞非遗制作，品尝地道农家宴席。',
      CAST('["往返大巴","非遗体验","农家午餐","向导讲解","意外险"]' AS JSON),
      '古村的风会吹走所有烦恼', '古村', 'valid', '2026-09-17', '2026-09-17 08:14:05.000'),
  (2, 10007, 3, 4, 7, '山野露营盲盒',   'nearby', 25900,
      '星空露营山野夜', '吉安 · 大冈山', 32800,
      '远离城市灯光，在山野里看银河星空，篝火旁聊天唱歌。',
      CAST('["往返交通","露营装备","烧烤晚餐","星空讲解"]' AS JSON),
      '星空下，你不需要很坚强', '露营', 'valid', '2026-09-17', '2026-09-17 10:07:06.000'),
  (3, 10063, 5, 3, 6, '城市探店盲盒',   'nearby',  8900,
      '赣江古镇美食探店', '吉安 · 永和镇', 13600,
      '逛千年吉州窑遗址，吃遍本地特色小吃，打卡网红书店。',
      CAST('["往返交通","美食基金","讲解耳机","意外险"]' AS JSON),
      '美食和风景，都不可辜负', '美食', 'valid', '2026-09-17', '2026-09-17 11:24:06.000');

INSERT INTO `user_badge` (`user_id`, `badge_id`, `source_trip_id`, `unlocked_at`) VALUES
  (10021, 1,  1, '2026-09-17 08:14:05.000'),
  (10007, 10, 2, '2026-09-17 10:07:06.000'),
  (10063, 3,  3, '2026-09-17 11:24:06.000');

-- ── B6. 聊天 / 心情 / 测试 ──
INSERT INTO `chat_message` (`user_id`, `conversation_id`, `sender`, `content`, `via_quick`, `token_in`, `token_out`, `fallback`, `created_at`) VALUES
  (10021, 'user:10021', 'user', '推荐散心的地方', 1, 0, 0, 1, '2026-09-17 08:10:00.000'),
  (10021, 'user:10021', 'ai',   '如果想散心的话，特别推荐「乡村治愈主题盲盒」或者「山野露营盲盒」～远离城市喧嚣，在古村或者山野待上一天，坏情绪会慢慢被治愈的。', 0, 0, 0, 1, '2026-09-17 08:10:01.000'),
  (10044, 'user:10044', 'user', '一个人旅行安全吗', 1, 120, 86, 0, '2026-09-17 09:38:00.000'),
  (10044, 'user:10044', 'ai',   '一个人旅行超酷的！我们的盲盒线路都很安全，一个人反而更自由，还能在路上认识新朋友。担心孤单的话随时找我聊天。', 0, 0, 0, 0, '2026-09-17 09:38:02.000');

INSERT INTO `mood_log` (`user_id`, `mood`, `box_id`, `created_at`) VALUES
  (10021, 'emo',     4, '2026-09-17 08:09:00.000'),
  (10044, 'curious', 2, '2026-09-17 09:37:00.000'),
  (10007, 'happy',   1, '2026-09-17 10:04:00.000'),
  (10058, 'bored',   7, '2026-09-16 21:16:00.000'),
  (10063, 'happy',   6, '2026-09-17 11:21:00.000');

INSERT INTO `personality_test` (`user_id`, `result_type`, `score_json`, `answers_json`, `duration_ms`, `created_at`) VALUES
  (10021, 'nature',    CAST('{"nature":11,"city":2,"adventure":2,"culture":0}' AS JSON), CAST('[3,1,1,1,1]' AS JSON), 42000, '2026-09-17 08:08:00.000'),
  (10044, 'culture',   CAST('{"nature":2,"city":7,"adventure":0,"culture":9}' AS JSON),  CAST('[2,3,4,4,3]' AS JSON), 51000, '2026-09-17 09:36:00.000'),
  (10007, 'adventure', CAST('{"nature":1,"city":2,"adventure":14,"culture":3}' AS JSON), CAST('[4,4,3,3,4]' AS JSON), 33000, '2026-09-17 10:03:00.000'),
  (10058, 'city',      CAST('{"nature":4,"city":11,"adventure":3,"culture":3}' AS JSON), CAST('[2,2,2,2,2]' AS JSON), 47000, '2026-09-16 21:15:00.000');

INSERT INTO `admin_audit_log` (`admin_id`, `action`, `target_type`, `target_id`, `detail_json`, `ip`) VALUES
  (1, 'refund_reject', 'refund', 'R20260916008', CAST('{"from":"pending_review","to":"rejected","reason":"已超出可退期限"}' AS JSON), '127.0.0.1');

INSERT INTO `stats_daily`
  (`stat_date`, `new_users`, `dau`, `box_open_count`, `gmv_cent`, `pay_success_count`, `pay_attempt_count`, `refund_cent`, `refund_count`) VALUES
  ('2026-09-11', 12, 38, 28, 468000, 31, 34, 12900, 1),
  ('2026-09-12', 18, 46, 36, 612000, 39, 43, 11900, 1),
  ('2026-09-13', 15, 41, 31, 528000, 34, 37,     0, 0),
  ('2026-09-14', 22, 58, 47, 824600, 51, 56, 15900, 1),
  ('2026-09-15', 19, 52, 42, 714000, 45, 49,     0, 0),
  ('2026-09-16', 26, 67, 55, 968200, 60, 65, 99900, 1),
  ('2026-09-17', 16, 47, 41, 746600, 44, 47,     0, 0);

UPDATE `blind_box` b SET `open_count` = (
  SELECT COUNT(*) FROM `biz_order` o WHERE o.`box_id` = b.`id` AND o.`status` = 'opened'
);
UPDATE `travel_route` r SET `draw_count` = (
  SELECT COUNT(*) FROM `trip` t WHERE t.`route_id` = r.`id` AND t.`validity` = 'valid'
);
