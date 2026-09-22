-- 途个惊喜 · 种子数据
-- 产品数据以 docs/页面原型.html 为准（6 盲盒、6 线路、12 徽章）
-- 标价 / 地名 / 保底禁止手改：改数据要同步改原型
--
-- 执行：
--   mysql -uroot -p < docs/schema.sql
--   mysql -uroot -p tuge < docs/seed.sql
--
-- 分两部分：
--   A. 配置种子（必须，没内容无法演示）
--   B. 演示数据（可选；正式部署可整段删掉）
--
-- 筛选维度共四个（都不影响开盒随机，开盒只看 category + 保底）：
--   category 分类   nearby / province / cross / theme
--   mood     心情   happy / emo / bored / curious
--   scene    景点类型 mountain / water / ancient_town / camp / food / art ...
--   price    价格档位 0-99 / 100-199 / 200-399 / 400+  （区间定义在 sys_config）

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

-- ── A2. 线路池 6 条（docs/页面原型.html TUGE_ROUTES） ──
-- scene 为该线路的主要景点类型，仅用于管理端筛选与池覆盖度提示，**不参与开盒随机**。
-- 保底校验（同分类启用线路须盖过盲盒 min_value_cent）：
--   nearby   120/160/200 → 线路 148/135/218。box_2(160) 仅 r3 合格；box_3(200) 仅 r3 合格
--   province 380         → r4 420 合格
--   cross    750         → r5 880 合格
--   theme    150         → r6 168 合格
DELETE FROM `travel_route`;
INSERT INTO `travel_route`
  (`id`, `name`, `category`, `location`, `scene`, `value_cent`, `cost_cent`, `badge_id`,
   `highlight`, `include_json`, `mood_text`, `status`) VALUES
  (1, '渼陂古村非遗一日游', 'nearby',   '吉安 · 青原区', 'ancient_town', 14800, NULL, 1,
      '青石街、打糍粑、老樟树',
      CAST('["交通","午餐","向导"]' AS JSON),
      '古村的风会吹走所有烦恼', 'on'),
  (2, '云雾茶山徒步采风',   'nearby',   '武夷山周边',   'mountain',     13500, NULL, 2,
      '茶垄步道、云海',
      CAST('["交通","茶歇","向导"]' AS JSON),
      '穿过云雾，听见心跳', 'on'),
  (3, '湖畔星空营地之夜',   'nearby',   '仙女湖畔',     'camp',         21800, NULL, 10,
      '星空、篝火、湖岸',
      CAST('["帐篷","晚餐","向导"]' AS JSON),
      '星空不说话，但够温暖', 'on'),
  (4, '三清山松云问道二日', 'province', '上饶 · 玉山',  'mountain',     42000, NULL, 4,
      '栈道、云海日出',
      CAST('["大巴","住宿","门票"]' AS JSON),
      '站在高处，天地开朗', 'on'),
  (5, '大理苍山洱海',       'cross',    '云南 · 大理',  'water',        88000, NULL, 5,
      '苍山索道、海东日落',
      CAST('["往返交通","一晚民宿"]' AS JSON),
      '去有风的地方重新开始', 'on'),
  (6, '西关深巷寻味记',     'theme',    '广州 · 西关',  'food',         16800, NULL, 3,
      '早茶、骑楼、糖水',
      CAST('["向导","三餐打卡"]' AS JSON),
      '烟火气是最好的良药', 'off');

UPDATE `travel_route`
SET `guide_version` = 1,
    `guide_json` = JSON_OBJECT(
      'overview', `highlight`,
      'durationText', CASE WHEN `category` = 'cross' THEN '3天2夜' WHEN `category` = 'province' THEN '2天1夜' ELSE '一日轻旅行' END,
      'paceText', CASE WHEN `category` = 'cross' THEN '松弛探索' WHEN `category` = 'province' THEN '舒展深度' WHEN `category` = 'theme' THEN '边走边尝' ELSE '轻松慢游' END,
      'walkText', CASE WHEN `category` = 'cross' THEN '8–12 千步/天' WHEN `category` = 'province' THEN '约 1.2 万步/天' WHEN `category` = 'theme' THEN '8–10 千步' ELSE '6–9 千步' END,
      'transitText', CASE WHEN `category` = 'cross' THEN '大交通自理' WHEN `category` = 'province' THEN '大巴往返' WHEN `category` = 'theme' THEN '城市公共交通' ELSE '集合接驳' END,
      'season', CASE WHEN `category` = 'cross' THEN '按目的地' WHEN `category` = 'province' THEN '春秋优先' WHEN `category` = 'theme' THEN '全年可行' ELSE '四季可行' END,
      'weather', CASE WHEN `category` = 'cross' THEN '同时查看出发地与目的地天气，关注温差和紫外线。' WHEN `category` = 'province' THEN '山区温差明显，请准备薄外套和雨具。' WHEN `category` = 'theme' THEN '城市步行线注意防晒补水，雨天优先室内点位。' ELSE '出发前一天确认降雨和集合时间，雨后路面较滑。' END,
      'facts', JSON_ARRAY(JSON_OBJECT('label','适合人群','value',CASE WHEN `category` = 'cross' THEN '成人独行或结伴' WHEN `category` = 'province' THEN '朋友、伴侣、轻户外' WHEN `category` = 'theme' THEN '朋友、亲子、美食爱好者' ELSE '独行、朋友、轻家庭' END), JSON_OBJECT('label','步行强度','value',CASE WHEN `category` = 'cross' THEN '每日约 8–12 千步' WHEN `category` = 'province' THEN '每日约 1.2 万步' WHEN `category` = 'theme' THEN '约 8–10 千步' ELSE '约 6–9 千步' END), JSON_OBJECT('label','集合时间','value','通常 08:00–09:00'), JSON_OBJECT('label','返程时间','value',CASE WHEN `category` = 'province' THEN 'D2 18:00 左右' WHEN `category` = 'cross' THEN '返程日预留换乘' ELSE '预计 17:30 前' END)),
      'schedules', JSON_ARRAY(
        JSON_OBJECT('dayNo', 1, 'time', '08:30', 'title', '集合出发', 'description', '核验订单并确认返程安排。'),
        JSON_OBJECT('dayNo', 1, 'time', '10:30', 'title', `name`, 'description', `highlight`),
        JSON_OBJECT('dayNo', CASE WHEN `category` = 'cross' THEN 3 WHEN `category` = 'province' THEN 2 ELSE 1 END, 'time', '17:00', 'title', '集合返程', 'description', '清点随身物品并按约定地点返程。')
      ),
      'spots', JSON_ARRAY(JSON_OBJECT('spotId', CONCAT('route-', `id`), 'name', `location`, 'coverUrl', '', 'highlights', `highlight`, 'notice', '开放时间与现场安排以出发前通知为准。', 'durationMinutes', 240)),
      'transport', JSON_ARRAY(JSON_OBJECT('title', '集合与接驳', 'description', '出发前一天在行程页确认集合点和车辆信息。')),
      'dining', JSON_ARRAY(JSON_OBJECT('title', '餐饮安排', 'description', '以订单服务内容和出发前通知为准。')),
      'lodging', CASE WHEN `category` IN ('province', 'cross') THEN JSON_ARRAY(JSON_OBJECT('title', '住宿安排', 'description', '入住信息在出发前通知中确认。')) ELSE JSON_ARRAY() END,
      'budgetItems', JSON_ARRAY(JSON_OBJECT('name', '个人机动消费', 'amount', 100, 'required', false)),
      'checklist', `include_json`,
      'planB', '如遇天气或景区临时调整，以安全为先切换室内点位，并保留返程时间。',
      'safetyTips', JSON_ARRAY('提前确认天气和集合时间', '不进入未开放区域', '保管好证件与订单信息'),
      'faqs', JSON_ARRAY(JSON_OBJECT('question', '集合信息在哪里查看？', 'answer', '出发前一天在行程详情和订单通知中查看。'))
    );

-- ── A3. 盲盒 6 个 + 适配心情 + 适配景点类型（docs/页面原型.html TUGE_BOXES） ──
-- box_6 默认下架，与原型一致（管理端提示「上架美食专线」）
DELETE FROM `blind_box_scene`;
DELETE FROM `blind_box_mood`;
DELETE FROM `blind_box`;
INSERT INTO `blind_box`
  (`id`, `name`, `category`, `tag`, `rank_tag`, `intro`, `price_cent`, `min_value_cent`,
   `cover_url`, `sort_weight`, `status`) VALUES
  (1, '周边微度假盲盒',   'nearby',   '周边游',   'TOP1', '1天短途，周末说走就走',
      9900,  12000, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80', 90, 'on'),
  (2, '隐世古村慢生活盒', 'nearby',   '周边游',   'TOP2', '青石古街，非遗打糍粑',
      12900, 16000, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 80, 'on'),
  (3, '山野露营观星盲盒', 'nearby',   '周边游',   'TOP3', '湖畔星空，篝火治愈夜',
      15900, 20000, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', 70, 'on'),
  (4, '省内仙山问道二日', 'province', '省内游',   'HOT',  '云海奇峰，探秘古建',
      29900, 38000, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 60, 'on'),
  (5, '跨省限定冒险盲盒', 'cross',    '跨省游',   'NEW',  '大山大河，说走就走',
      59900, 75000, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', 50, 'on'),
  (6, '老城寻味美食专线', 'theme',    '主题专线', 'HOT',  '街角早茶，烟火气',
      11900, 15000, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 40, 'on'),
  -- 普通盲盒低价档位：0.1 ~ 10 元全档覆盖（min_value_cent 需低于对应线路池最低票面）
  (20, '一毛钱周边惊喜盒', 'nearby',   '超值盲盒', NULL, '一毛钱开出一处周边好去处',
      10,    10000, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80', 30, 'on'),
  (21, '五毛钱主题尝鲜盒', 'theme',    '超值盲盒', NULL, '五毛钱解锁一个主题玩法',
      50,    12000, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 31, 'on'),
  (22, '一元周边微旅行盒', 'nearby',   '超值盲盒', NULL, '一块钱来一场说走就走的微旅行',
      100,   10000, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', 32, 'on'),
  (23, '二元省内踏青盒',   'province', '超值盲盒', NULL, '两块钱抽一条省内踏青线路',
      200,   30000, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 33, 'on'),
  (24, '三元主题奇遇盒',   'theme',    '超值盲盒', NULL, '三块钱遇见一份主题奇遇',
      300,   12000, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 34, 'on'),
  (25, '五元跨省启程盒',   'cross',    '超值盲盒', NULL, '五块钱开启跨省冒险第一站',
      500,   70000, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', 35, 'on'),
  (26, '八元省内山水盒',   'province', '超值盲盒', NULL, '八块钱抽一段省内山水行程',
      800,   30000, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 36, 'on'),
  (27, '十元跨省畅行盒',   'cross',    '超值盲盒', NULL, '十块钱解锁一次跨省畅行',
      1000,  70000, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', 37, 'on');

UPDATE `blind_box`
SET `description` = CONCAT(`intro`, '。目的地在支付完成并开盒后揭晓，订单保留商品售价、保底价值与分类快照。'),
    `images_json` = JSON_ARRAY(`cover_url`),
    `includes_json` = CASE `category`
      WHEN 'nearby' THEN JSON_ARRAY('往返交通', '向导陪同', '页面标明的主题体验')
      WHEN 'province' THEN JSON_ARRAY('大巴往返', '住宿', '基础门票', '向导陪同')
      WHEN 'cross' THEN JSON_ARRAY('当地接驳', '住宿', '主行程体验', '行程服务')
      ELSE JSON_ARRAY('市内交通', '主题体验', '向导讲解') END,
    `guide_preview_json` = JSON_OBJECT(
      'title', CONCAT(`tag`, '主题出行攻略'),
      'summary', `intro`,
      'durationText', CASE WHEN `category` = 'cross' THEN '3天2夜' WHEN `category` = 'province' THEN '2天1夜' ELSE '1天' END,
      'sceneTags', JSON_ARRAY(`tag`),
      'notice', '具体集合点与最终线路以开盒后的行程快照为准。'
    ),
    `version` = 0;

INSERT INTO `blind_box_mood` (`box_id`, `mood`) VALUES
  (1, 'happy'), (1, 'emo'),   (1, 'bored'),
  (2, 'emo'),   (2, 'curious'),
  (3, 'emo'),   (3, 'curious'), (3, 'bored'),
  (4, 'happy'), (4, 'curious'),
  (5, 'bored'), (5, 'curious'),
  (6, 'happy'), (6, 'bored');

INSERT INTO `blind_box_scene` (`box_id`, `scene`) VALUES
  (1, 'mountain'), (1, 'ancient_town'),
  (2, 'ancient_town'), (2, 'village'),
  (3, 'mountain'), (3, 'camp'),
  (4, 'mountain'), (4, 'ancient_town'),
  (5, 'water'),
  (6, 'food'), (6, 'ancient_town');

-- ── A4. 运营位 ──
DELETE FROM `banner`;
INSERT INTO `banner`
  (`id`, `title`, `subtitle`, `tag_text`, `image_url`, `jump_type`, `jump_value`, `sort_weight`, `status`) VALUES
  (1, '暑期限定盲盒上线', '全系列票面价值保底120%', '价值保底',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      'none', NULL, 90, 'on'),
  (2, 'emo 日专场', '隐世古村与山野露营，把皱抚平', '心情匹配',
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
-- recommend_box_ids 必须指向 A3 里真实存在的上架盲盒（下表引用的都是 id ≤ 5 的在架盒子）
DELETE FROM `ai_quick_question`;
INSERT INTO `ai_quick_question` (`text`, `sort_weight`, `status`) VALUES
  ('推荐散心的地方',   90, 'on'),
  ('周末一日游推荐',   80, 'on'),
  ('一个人旅行安全吗', 70, 'on');

DELETE FROM `ai_keyword_rule`;
INSERT INTO `ai_keyword_rule` (`keywords_json`, `reply_text`, `recommend_box_ids`, `sort_weight`, `status`) VALUES
  (CAST('["散心","不好","emo"]' AS JSON),
   '如果想散心的话，特别推荐「隐世古村慢生活盒」或者「山野露营观星盲盒」～远离城市喧嚣，在古村或者湖畔待上一天，坏情绪会慢慢被治愈的。',
   CAST('[2,3]' AS JSON), 90, 'on'),
  (CAST('["周末","一日游"]' AS JSON),
   '周末一日游的话，周边微度假盲盒超合适！不用提前做攻略，说走就走，古村探秘、露营观星都有满满的惊喜感。',
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
  ('今天在{目的地}把{线路名称}走了一遍。{亮点}比照片里还像样，回来路上一直在回味。', 90, 'on'),
  ('开了盒{线路名称}，落点在{目的地}。印象最深的是{亮点}，随性走走反而比赶行程舒服。', 85, 'on'),
  ('{目的地}这趟没白去。{亮点}那会儿光线刚好，随手拍都不用修图，值回票价。', 80, 'on'),
  ('临时起意去{目的地}，{亮点}是意外之喜。不赶时间，走到哪算哪，一天就这么舒服地过去了。', 75, 'on'),
  ('在{目的地}慢悠悠晃了一天，{亮点}没让人失望。下次想换个季节再来一趟。', 70, 'on'),
  ('{线路名称}开出来是{目的地}。{亮点}体验很扎实，吃喝也没踩坑，这盒开得值。', 65, 'on');

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
  ('ai.enabled',             'true',   '是否启用 AI 模型'),
  ('ai.tools_enabled',       'true',   '是否启用 Tool 查询上架盲盒'),
  ('ai.rag.enabled',         'false',  '第一期用 Tool 代替 RAG'),
  ('ai.fallback_enabled',    'true',   '模型失败时走关键词或默认回复'),
  ('ai.welcome',             '嗨～我是你的旅行搭子小途，不知道去哪玩都可以问我哦！', 'AI 页开场白'),
  ('ai.system_prompt',       '你是「途个惊喜」的旅行搭子小途，陪用户聊旅行、帮着挑盲盒的朋友。\n【怎么说话】\n- 像微信聊天那样回，两三句话、几十个字就够，别写作文\n- 口语短句，可以带点小情绪和小口头禅；表情最多一个，能不用就不用\n- 禁止「为您推荐」「首先/其次/总之」「希望对你有帮助」「祝旅途愉快」这类客服腔和作文腔\n- 不列长清单；推荐时一次最多提两个盒子，用一句话说清它适合什么样的人\n- 对方说得短你就回得短，跟着对方的语气走\n【底线】\n- 自称小途，不说自己是模型\n- 推荐只能来自提供的事实（当前上架盲盒与启用线路），不虚构价格、线路和优惠\n- 不承诺抽中某条线路，未开盒前不透露具体目的地\n- 不执行支付、退款或开盒；退款问题引导去「我的 → 订单」\n- 涉及安全时提醒官方线路含向导和交通，不鼓励盲目穷游', '小途人设'),
  ('ai.diary_prompt',        '你在替一位刚开完旅行盲盒的用户写一条随手发的旅行日记，第一人称，像手帐，不像作文。素材：{线路名称}、{目的地}、{亮点}、{情绪文案}、{购入价}元、{票面价值}元。要求：只写一段，60-120 字，不分点、不用小标题；自然提到目的地和亮点，价格最多出现一次，别写成账单；写具体的画面和小细节（光线、天气、声音、吃到的味道），不堆「治愈」「惊喜」「遇见更好的自己」这类空词；语气放松，结尾别喊口号、别升华；只出现素材里的地点，不虚构没提到的景点、餐厅或服务；不要出现「AI」「生成」「模型」字样。', '旅行日记 Prompt'),
  ('copy.value_guard',       '票面价值不低于售价 120%，符合保障规则可申请退换。', '「我的」服务说明 1'),
  ('copy.mood_match',        '按心情匹配旅行主题与线路，不替你指定抽中哪一条。', '「我的」服务说明 2'),
  ('copy.village',           '每售出 1 份盲盒提取 1 元纳入扶持金。', '「我的」服务说明 3'),
  ('badge.total',            '12',     '徽章总数，用户端进度分母'),
  ('price.tiers',            '[{"label":"¥99 以下","min":0,"max":99},{"label":"¥100-199","min":100,"max":199},{"label":"¥200-399","min":200,"max":399},{"label":"¥400 以上","min":400,"max":null}]', '价格档位筛选；改档位不动代码与数据'),
  ('scene.tags',             '[{"key":"mountain","label":"山野"},{"key":"water","label":"江河湖海"},{"key":"ancient_town","label":"古镇"},{"key":"sea","label":"海滨"},{"key":"forest","label":"森林"},{"key":"camp","label":"露营"},{"key":"village","label":"乡村"},{"key":"food","label":"美食"},{"key":"art","label":"文艺"},{"key":"red","label":"红色"},{"key":"study","label":"研学"},{"key":"photography","label":"摄影"}]', '景点类型词表；与 blind_box_scene.scene / travel_route.scene 取值一致');

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

-- ── B2. 订单（覆盖 5 种状态；box_id / 名称 / 金额必须与 A3 一致） ──
-- 7 号单刻意停在 paid：用来演示管理端「补单」入口（paid 且 trip_id 为空）
-- 5 号单对应的 box_6 已下架：演示「历史订单不受下架影响」
INSERT INTO `biz_order`
  (`id`, `order_no`, `user_id`, `box_id`, `box_name`, `box_category`, `price_cent`, `paid_cent`,
   `min_value_cent`, `status`, `pay_channel`, `expire_at`, `paid_at`, `opened_at`, `cancelled_at`,
   `route_id`, `trip_id`, `created_at`) VALUES
  (1, 'T20260917001', 10021, 1, '周边微度假盲盒',   'nearby',    9900,  9900,  12000, 'opened',
      'alipay', '2026-09-17 08:27:00.000', '2026-09-17 08:14:00.000', '2026-09-17 08:14:05.000', NULL, 1, 1, '2026-09-17 08:12:00.000'),
  (2, 'T20260917002', 10044, 2, '隐世古村慢生活盒', 'nearby',   12900,     0,  16000, 'pending_pay',
      NULL,     '2026-09-17 09:55:00.000', NULL, NULL, NULL, NULL, NULL, '2026-09-17 09:40:00.000'),
  (3, 'T20260917003', 10007, 3, '山野露营观星盲盒', 'nearby',   15900, 15900,  20000, 'opened',
      'alipay', '2026-09-17 10:20:00.000', '2026-09-17 10:07:00.000', '2026-09-17 10:07:06.000', NULL, 3, 2, '2026-09-17 10:05:00.000'),
  (4, 'T20260917004', 10058, 5, '跨省限定冒险盲盒', 'cross',    59900, 59900,  75000, 'refunded',
      'alipay', '2026-09-16 21:33:00.000', '2026-09-16 21:20:00.000', NULL, NULL, NULL, NULL, '2026-09-16 21:18:00.000'),
  (5, 'T20260917005', 10063, 6, '老城寻味美食专线', 'theme',    11900, 11900,  15000, 'opened',
      'alipay', '2026-09-17 11:37:00.000', '2026-09-17 11:24:00.000', '2026-09-17 11:24:06.000', NULL, 6, 3, '2026-09-17 11:22:00.000'),
  (6, 'T20260917006', 10044, 4, '省内仙山问道二日', 'province', 29900,     0,  38000, 'cancelled',
      NULL,     '2026-09-16 19:17:00.000', NULL, NULL, '2026-09-16 19:17:30.000', NULL, NULL, '2026-09-16 19:02:00.000'),
  (7, 'T20260917007', 10063, 1, '周边微度假盲盒',   'nearby',    9900,  9900,  12000, 'paid',
      'alipay', '2026-09-17 12:05:00.000', '2026-09-17 11:52:00.000', NULL, NULL, NULL, NULL, '2026-09-17 11:50:00.000');

-- ── B3. 支付流水（金额与 B2 对齐；2 号单演示失败路径） ──
INSERT INTO `payment_flow` (`id`, `flow_no`, `order_id`, `order_no`, `channel`, `channel_trade_no`, `amount_cent`, `result`, `notify_id`) VALUES
  (1, 'F20260917001', 1, 'T20260917001', 'alipay', '2026091722001400000001',  9900, 'success', 'N2026091700001'),
  (2, 'F20260917002', 3, 'T20260917003', 'alipay', '2026091722001400000002', 15900, 'success', 'N2026091700002'),
  (3, 'F20260917003', 4, 'T20260917004', 'alipay', '2026091722001400000003', 59900, 'success', 'N2026091700003'),
  (4, 'F20260917004', 5, 'T20260917005', 'alipay', '2026091722001400000004', 11900, 'success', 'N2026091700004'),
  (5, 'F20260917005', 7, 'T20260917007', 'alipay', '2026091722001400000005',  9900, 'success', 'N2026091700005'),
  (6, 'F20260917006', 2, 'T20260917002', 'alipay', NULL,                     12900, 'fail',    NULL);

-- ── B4. 退款单 ──
-- 订单 4：演示抽奖失败自动退（当前池实际能盖过保底，此单只为状态机展示）
INSERT INTO `refund_order`
  (`id`, `refund_no`, `order_id`, `order_no`, `user_id`, `amount_cent`, `reason`, `kind`, `status`,
   `channel_refund_no`, `reviewer_id`, `reject_reason`, `reviewed_at`) VALUES
  (1, 'R20260917001', 4, 'T20260917004', 10058, 59900, '池中无线路满足保底',    'draw_fail',   'auto',
      '2026091722001400000099', NULL, NULL, NULL),
  (2, 'R20260917002', 1, 'T20260917001', 10021,  9900, '未出行退换 · 行程冲突', 'unused',      'pending_review',
      NULL, NULL, NULL, NULL),
  (3, 'R20260917003', 3, 'T20260917003', 10007, 15900, '计划变更',             'unused',      'pending_review',
      NULL, NULL, NULL, NULL),
  (4, 'R20260916008', 1, 'T20260917001', 10021,  9900, '重复申请',             'unused',      'rejected',
      NULL, 1, '已超出可退期限', '2026-09-16 18:00:00.000');

-- ── B5. 行程（仅 valid；退款通过后才会变 invalid） ──
INSERT INTO `trip`
  (`id`, `user_id`, `order_id`, `route_id`, `box_id`, `box_name`, `box_category`, `price_cent`,
   `route_name`, `location`, `value_cent`, `highlight`, `include_json`, `mood_text`, `badge_name`,
   `validity`, `opened_date`, `created_at`) VALUES
  (1, 10021, 1, 1, 1, '周边微度假盲盒',   'nearby',  9900,
      '渼陂古村非遗一日游', '吉安 · 青原区', 14800,
      '青石街、打糍粑、老樟树',
      CAST('["交通","午餐","向导"]' AS JSON),
      '古村的风会吹走所有烦恼', '古村', 'valid', '2026-09-17', '2026-09-17 08:14:05.000'),
  (2, 10007, 3, 3, 3, '山野露营观星盲盒', 'nearby', 15900,
      '湖畔星空营地之夜', '仙女湖畔', 21800,
      '星空、篝火、湖岸',
      CAST('["帐篷","晚餐","向导"]' AS JSON),
      '星空不说话，但够温暖', '露营', 'valid', '2026-09-17', '2026-09-17 10:07:06.000'),
  (3, 10063, 5, 6, 6, '老城寻味美食专线', 'theme',  11900,
      '西关深巷寻味记', '广州 · 西关', 16800,
      '早茶、骑楼、糖水',
      CAST('["向导","三餐打卡"]' AS JSON),
      '烟火气是最好的良药', '美食', 'valid', '2026-09-17', '2026-09-17 11:24:06.000');

UPDATE `trip` t
JOIN `travel_route` r ON r.`id` = t.`route_id`
SET t.`guide_snapshot_json` = r.`guide_json`,
    t.`guide_version` = r.`guide_version`;

INSERT INTO `user_badge` (`user_id`, `badge_id`, `source_trip_id`, `unlocked_at`) VALUES
  (10021, 1,  1, '2026-09-17 08:14:05.000'),
  (10007, 10, 2, '2026-09-17 10:07:06.000'),
  (10063, 3,  3, '2026-09-17 11:24:06.000');

-- ── B6. 聊天 / 心情 / 测试 ──
INSERT INTO `chat_message` (`user_id`, `conversation_id`, `sender`, `content`, `via_quick`, `token_in`, `token_out`, `fallback`, `created_at`) VALUES
  (10021, 'user:10021', 'user', '推荐散心的地方', 1, 0, 0, 1, '2026-09-17 08:10:00.000'),
  (10021, 'user:10021', 'ai',   '如果想散心的话，特别推荐「隐世古村慢生活盒」或者「山野露营观星盲盒」～远离城市喧嚣，在古村或者湖畔待上一天，坏情绪会慢慢被治愈的。', 0, 0, 0, 1, '2026-09-17 08:10:01.000'),
  (10044, 'user:10044', 'user', '一个人旅行安全吗', 1, 120, 86, 0, '2026-09-17 09:38:00.000'),
  (10044, 'user:10044', 'ai',   '一个人旅行超酷的！我们的盲盒线路都很安全，一个人反而更自由，还能在路上认识新朋友。担心孤单的话随时找我聊天。', 0, 0, 0, 0, '2026-09-17 09:38:02.000');

INSERT INTO `mood_log` (`user_id`, `mood`, `box_id`, `created_at`) VALUES
  (10021, 'emo',     2, '2026-09-17 08:09:00.000'),
  (10044, 'curious', 4, '2026-09-17 09:37:00.000'),
  (10007, 'happy',   1, '2026-09-17 10:04:00.000'),
  (10058, 'bored',   3, '2026-09-16 21:16:00.000'),
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


-- ═══════════════════════════════════════════════════════
-- 新增功能种子数据（打卡/成就/社区/商家）
-- 更新时间：2026-09-18
-- ═══════════════════════════════════════════════════════

-- ── C1. 成就定义 ──
DELETE FROM `user_achievement`;
DELETE FROM `achievement`;
INSERT INTO `achievement` (`id`, `code`, `name`, `description`, `requirement_type`, `requirement_value`, `reward_type`, `reward_value`, `level`, `sort_weight`, `status`) VALUES
  (1,  'checkin_1',   '初次打卡',     '完成首次景点打卡',     'checkin_count', 1,  'coupon',   '{"coupon_id": 1}', 1, 100, 'on'),
  (2,  'checkin_5',   '打卡达人',     '打卡5个不同景点',     'checkin_count', 5,  'coupon',   '{"coupon_id": 2}', 2, 90, 'on'),
  (3,  'checkin_10',  '金牌打卡者',   '打卡10个景点',        'checkin_count', 10, 'blind_box', '{"box_id": 1}', 3, 80, 'on'),
  (4,  'checkin_20',  '钻石收藏家',   '打卡20个景点',        'checkin_count', 20, 'blind_box', '{"box_id": 4}', 4, 70, 'on'),
  (5,  'checkin_50',  '终极王者',     '打卡50个景点，解锁隐藏盲盒', 'checkin_count', 50, 'blind_box', '{"box_id": 5}', 5, 60, 'on'),
  (6,  'trip_3',      '旅行新手',     '完成3次行程',        'trip_count',    3,  'coupon',   '{"coupon_id": 3}', 1, 95, 'on'),
  (7,  'trip_8',      '旅行家',       '完成8次行程',        'trip_count',    8,  'badge',    '{"badge_id": 12}', 3, 75, 'on'),
  (8,  'badge_all',   '徽章收藏家',   '集齐全部12枚徽章',   'badge_count',   12, 'blind_box', '{"box_id": 5}', 4, 65, 'on'),
  (9,  'post_10',     '内容创作者',   '发布10篇帖子',       'post_count',    10, 'coupon',   '{"coupon_id": 4}', 2, 85, 'on'),
  (10, 'expense_500', '资深玩家',     '累计消费满500元',    'expense_sum',   50000, 'coupon', '{"coupon_id": 5}', 3, 70, 'on');

-- ── C2. 商家联盟 ──
DELETE FROM `user_coupon`;
DELETE FROM `coupon`;
DELETE FROM `partner`;
INSERT INTO `partner` (`id`, `name`, `type`, `contact`, `phone`, `address`, `description`, `commission_rate`, `settlement_type`, `status`, `contract_start`, `total_orders`, `total_amount_cent`) VALUES
  (1, '渼陂古村景区',     'ticket',      '李经理', '13800001101', '吉安市青原区渼陂古村', '国家4A级景区，红色文化与古建筑交相辉映', 0.0500, 'coupon', 'on', '2026-01-01', 156, 2340000),
  (2, '仙女湖度假酒店',   'hotel',       '王总',   '13800001102', '新余市仙女湖区湖畔路88号', '五星级湖畔度假酒店，星空帐篷与豪华客房', 0.0800, 'coupon', 'on', '2026-01-01', 89, 4450000),
  (3, '武夷云雾茶庄',     'meal',        '张老板', '13800001103', '南平市武夷山星村镇', '百年老字号茶庄，体验采茶制茶乐趣', 0.0600, 'coupon', 'on', '2026-03-01', 234, 1170000),
  (4, '三清山索道公司',   'ticket',      '刘经理', '13800001104', '上饶市玉山县三清山', '世界自然遗产，江西最高峰', 0.0500, 'commission', 'on', '2026-01-01', 312, 9360000),
  (5, '大理洱海民宿联盟', 'hotel',       '杨掌柜', '13800001105', '大理市双廊镇洱海边', '海景民宿，面朝洱海春暖花开', 0.1000, 'coupon', 'on', '2026-02-01', 178, 7120000),
  (6, '途个文创工作室',   'merchandise', '小林',   '13800001106', '南昌市红谷滩区', '原创旅行文创，冰箱贴/明信片/钥匙扣', 0.0000, 'coupon', 'on', '2026-01-01', 456, 456000);

-- ── C3. 优惠券 ──
INSERT INTO `coupon` (`id`, `code`, `name`, `type`, `partner_id`, `discount_amount`, `min_order_amount`, `valid_days`, `total_count`, `remain_count`, `status`) VALUES
  (1,  'FIRST10',     '新手打卡券',     'deduction', NULL,   1000,  0,     30, 1000, 850,  'on'),
  (2,  'CHECKIN20',   '打卡达人券',     'deduction', NULL,   2000,  5000,  60, 500,  420,  'on'),
  (3,  'TRIP15',      '行程优惠券',     'deduction', NULL,   1500,  3000,  30, 800,  680,  'on'),
  (4,  'POST50',      '创作激励券',     'deduction', NULL,   5000,  10000, 90, 200,  180,  'on'),
  (5,  'VIP100',      '资深玩家专属',   'deduction', NULL,  10000, 20000, 180, 50,   45,   'on'),
  (10, 'ANCIENT20',   '渼陂古村门票券', 'gift',      1,      NULL,  NULL,  30, 200,  180,  'on'),
  (11, 'LAKE50',      '仙女湖住宿抵扣', 'deduction', 2,      5000, 20000,  30, 100,  85,   'on'),
  (12, 'TEA30',        '云雾茶庄品鉴券', 'gift',      3,      NULL,  NULL,  30, 150,  130,  'on');

-- ── C4. 话题广场 ──
DELETE FROM `user_topic_follow`;
DELETE FROM `topic`;
INSERT INTO `topic` (`id`, `name`, `cover_url`, `description`, `post_count`, `follow_count`, `heat_weight`, `sort_weight`, `status`) VALUES
  (1,  '周末去哪儿',    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80', '周末就要出去玩！分享你的周末目的地', 2, 0, 100, 100, 'on'),
  (2,  '美食探店',      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80', '吃货必看！发现各地特色美食', 1, 0, 90, 90, 'on'),
  (3,  '情侣出游',      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=400&q=80', '和TA一起走过的地方', 0, 0, 80, 80, 'on'),
  (4,  '带娃旅行',      'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=400&q=80', '亲子游攻略，让带娃旅行更轻松', 1, 0, 70, 70, 'on'),
  (5,  '小众秘境',      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', '发现那些不为人知的美景', 1, 0, 60, 60, 'on'),
  (6,  '盲盒开箱',      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80', '分享你的盲盒开箱体验', 1, 0, 110, 95, 'on');

-- ── C5. 盲盒奖品配置 ──
DELETE FROM `blind_box_prize`;
-- 周边微度假盲盒（id=1，售价99元）的奖品
INSERT INTO `blind_box_prize` (`blind_box_id`, `prize_type`, `prize_name`, `prize_value_cent`, `quantity`, `probability`, `partner_id`, `description`, `status`) VALUES
  (1, 'coupon',      '渼陂古村门票券',      2000,  100, 0.2000, 1,  '免费游览渼陂古村', 'on'),
  (1, 'coupon',      '餐饮抵用券10元',      1000,  200, 0.3000, 3,  '茶庄消费满30可用', 'on'),
  (1, 'merchandise', '途个惊喜冰箱贴',       500,  300, 0.3500, 6,  '限量文创周边', 'on'),
  (1, 'coupon',      '仙女湖住宿抵扣券',    5000,   50, 0.1000, 2,  '满200抵50', 'on'),
  (1, 'coupon',      '云雾茶庄体验券',      3000,   30, 0.0500, 3,  '采茶体验一次', 'on');
-- 隐世古村慢生活盒（id=2，售价129元）
INSERT INTO `blind_box_prize` (`blind_box_id`, `prize_type`, `prize_name`, `prize_value_cent`, `quantity`, `probability`, `partner_id`, `description`, `status`) VALUES
  (2, 'coupon',      '渼陂古村门票券×2',   4000,   80, 0.2000, 1,  '双人免费游览', 'on'),
  (2, 'coupon',      '餐饮抵用券20元',      2000,  150, 0.3000, 3,  '茶庄消费满50可用', 'on'),
  (2, 'merchandise', '古村明信片套装',       800,  200, 0.2500, 6,  '手工制作', 'on'),
  (2, 'coupon',      '住宿抵用券30元',      3000,   40, 0.1500, 2,  '满100抵30', 'on'),
  (2, 'badge',       '古村徽章',            0,      0, 0.1000, NULL, '集齐可兑换盲盒', 'on');

-- ── C6. 社区帖子演示数据 ──
DELETE FROM `post_comment`;
DELETE FROM `post_like`;
DELETE FROM `post_collect`;
DELETE FROM `post_image`;
DELETE FROM `community_post`;
INSERT INTO `community_post` (`id`, `user_id`, `title`, `content`, `topic_id`, `location_name`, `public_location`, `linked_blind_box_id`, `linked_trip_id`, `like_count`, `comment_count`, `share_count`, `collect_count`, `status`, `created_at`) VALUES
  (1, 10021, '古村亲子游超出预期', '孩子玩得超开心，还学会了打糍粑。这份盲盒也很划算，适合周末慢慢逛。', 4, '吉安·渼陂古村', 1, 1, 1, 0, 2, 0, 0, 'featured', '2026-09-16 14:30:00.000'),
  (2, 10044, '仙女湖的日落太美了', '盲盒开出意外惊喜，湖边的光线非常温柔，下次还想再来。', 6, '新余·仙女湖', 1, 1, NULL, 0, 1, 0, 0, 'published', '2026-09-15 18:45:00.000'),
  (3, 10007, '周末逃离城市去看星空', '湖畔徒步和露营都很舒服，晚上抬头就是整片星空。', 5, '新余·仙女湖', 1, 3, 2, 0, 1, 0, 0, 'published', '2026-09-14 09:20:00.000'),
  (4, 10058, '三清山云海日出攻略', '建议提前看天气，早上四点出发，山顶风大记得带外套。', 1, '上饶·三清山', 1, 4, NULL, 0, 0, 0, 0, 'featured', '2026-09-13 07:15:00.000'),
  (5, 10063, '西关三天两夜寻味记', '早茶、骑楼和糖水都值得慢慢体验，巷子里的烟火气最治愈。', 2, '广州·西关', 1, 6, 3, 0, 0, 0, 0, 'published', '2026-09-12 16:40:00.000'),
  (6, 10021, '第一次打卡完成', '从行程页完成打卡后，成就进度也同步更新了。', 1, '吉安·青原区', 1, NULL, 1, 0, 0, 0, 0, 'review', '2026-09-11 20:00:00.000');

INSERT INTO `post_image` (`post_id`, `url`, `sort_order`) VALUES
  (1, 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=900&q=80', 0),
  (1, 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=900&q=80', 1),
  (2, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80', 0),
  (3, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80', 0),
  (4, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80', 0),
  (5, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80', 0),
  (6, 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=900&q=80', 0);

INSERT INTO `post_comment` (`id`, `post_id`, `user_id`, `content`, `status`, `created_at`) VALUES
  (1, 1, 10044, '路线看起来很适合周末，已经收藏了。', 'published', '2026-09-16 15:00:00.000'),
  (2, 1, 10021, '带孩子的话建议上午早点到。', 'published', '2026-09-16 15:08:00.000'),
  (3, 2, 10007, '日落时间大概几点？', 'published', '2026-09-15 19:00:00.000'),
  (4, 3, 10063, '星空照片太有氛围了。', 'published', '2026-09-14 10:00:00.000');

-- ── C7. 打卡记录演示数据 ──
DELETE FROM `checkin_like`;
DELETE FROM `checkin_image`;
DELETE FROM `checkin`;
INSERT INTO `checkin` (`id`, `user_id`, `trip_id`, `route_id`, `location_name`, `public_location`, `note`, `like_count`, `status`, `created_at`) VALUES
  (1, 10021, 1, 1, '渼陂古村', 1, '第一次带孩子来古村，超开心！', 0, 'published', '2026-09-10 11:30:00.000'),
  (2, 10007, 2, 3, '仙女湖畔', 1, '星空露营太浪漫了', 0, 'published', '2026-09-04 21:30:00.000'),
  (3, 10063, 3, 6, '广州西关', 1, '跟着行程一路吃到老街深处。', 0, 'published', '2026-09-18 12:00:00.000');

INSERT INTO `checkin_image` (`checkin_id`, `url`, `sort_order`) VALUES
  (1, 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=900&q=80', 0),
  (2, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80', 0),
  (3, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80', 0);

-- ── C8. 用户积分演示 ──
DELETE FROM `point_log`;
DELETE FROM `user_point`;
INSERT INTO `user_point` (`user_id`, `balance`, `total_earned`, `total_spent`) VALUES
  (10021, 1250, 1500, 250),
  (10044, 890, 1000, 110),
  (10007, 2100, 2500, 400),
  (10058, 680,  800, 120),
  (10063, 450,  500,  50);

INSERT INTO `point_log` (`user_id`, `change`, `balance_after`, `type`, `biz_id`, `description`) VALUES
  (10021, 100, 100, 'signin', NULL, '每日签到'),
  (10021, 50, 150, 'checkin', 1, '打卡奖励'),
  (10021, 500, 650, 'achievement', NULL, '成就解锁奖励'),
  (10021, -250, 400, 'exchange', NULL, '积分兑换优惠券'),
  (10021, 100, 500, 'order', 1, '购买盲盒赠送'),
  (10021, 750, 1250, 'achievement', NULL, '成就解锁奖励');

-- ── C9. 用户成就演示 ──
INSERT INTO `user_achievement` (`user_id`, `achievement_id`, `progress`, `unlocked`, `unlocked_at`, `reward_sent`) VALUES
  (10021, 1, 1, 1, '2026-09-10 11:30:00.000', 1),
  (10021, 2, 5, 1, '2026-09-14 10:00:00.000', 1),
  (10021, 3, 10, 1, '2026-09-16 20:00:00.000', 1),
  (10021, 6, 3, 1, '2026-09-15 18:00:00.000', 1),
  (10044, 1, 1, 1, '2026-09-06 06:00:00.000', 1),
  (10044, 4, 1, 0, NULL, 0),
  (10007, 1, 1, 1, '2026-09-04 21:30:00.000', 1),
  (10007, 2, 5, 1, '2026-09-12 09:00:00.000', 1),
  (10007, 3, 10, 1, '2026-09-15 15:00:00.000', 1),
  (10007, 5, 4, 0, NULL, 0);
