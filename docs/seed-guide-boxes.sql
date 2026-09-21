-- 途个惊喜 · 增量种子：纯攻略盲盒 + 分类线路扩充
-- 更新时间：2026-09-21
--
-- ★ 执行顺序：seed.sql → 本文件 → seed-guide-v3.sql（v3 会把 100-126 的
--   guide_json 升级为 v2 级详细攻略，模板写法仅作兜底）
--
-- 内容：
--   A. 新分类 guide（纯攻略）：3 个盲盒 ¥0.01 / ¥9.9 / ¥19.9 + 攻略线路池
--   B. 现有 4 分类（nearby / province / cross / theme）按地点 · 类型 · 省市扩充线路
--
-- 说明：
--   · 盲盒使用 id 7-9，线路使用 id 100-126（避开已有数据，可重复执行）
--   · 开盒只看 category + 保底，攻略盒开盒后得到的是「电子攻略行程」
--   · 徽章沿用 seed.sql A1 的 12 枚（id 1-12）
--   · 全部线路带 guide_json（与 seed.sql 的攻略模板同构），开盒即得完整攻略快照

SET NAMES utf8mb4;
SET time_zone = '+08:00';

USE `tuge`;

-- ═══════════════════════════════════════════════════════
-- A. 纯攻略盲盒（分类 guide）
-- ═══════════════════════════════════════════════════════

-- ── A1. 盲盒 3 个 ──
DELETE FROM `blind_box_mood` WHERE `box_id` BETWEEN 7 AND 9;
DELETE FROM `blind_box_scene` WHERE `box_id` BETWEEN 7 AND 9;
DELETE FROM `blind_box` WHERE `id` BETWEEN 7 AND 9;
INSERT INTO `blind_box`
  (`id`, `name`, `category`, `tag`, `rank_tag`, `intro`, `price_cent`, `min_value_cent`,
   `cover_url`, `sort_weight`, `status`) VALUES
  (7, '一分钱攻略体验盒',   'guide', '纯攻略', 'NEW',  '一分钱抽专业旅行攻略，先尝后买不踩坑',
      1,    990,  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80', 95, 'on'),
  (8, '9.9元深度攻略盲盒',  'guide', '纯攻略', 'HOT',  '9块9开出深度攻略：行程路线 + 美食清单 + 避坑指南',
      990,  1990, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', 85, 'on'),
  (9, '19.9元定制攻略盲盒', 'guide', '纯攻略', 'TOP2', '高阶攻略含分日行程、美食地图与拍照机位推荐',
      1990, 2990, 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=800&q=80', 75, 'on');

UPDATE `blind_box`
SET `description` = CONCAT(`intro`, '。纯攻略盒开盒后获得目的地电子攻略（含分日行程、美食清单与避坑提示），不含实体制票与接待服务，票面价值即攻略制作价值。'),
    `images_json` = JSON_ARRAY(`cover_url`),
    `includes_json` = JSON_ARRAY('目的地深度攻略', '美食打卡清单', '避坑与机位提示'),
    `guide_preview_json` = JSON_OBJECT(
      'title', '纯攻略盲盒 · 开盒即得完整攻略',
      'summary', `intro`,
      'durationText', '电子攻略 · 即买即用',
      'sceneTags', JSON_ARRAY('攻略', `tag`),
      'notice', '开盒后获得电子攻略快照，可在行程页随时查看；攻略不含交通、住宿与门票。'
    ),
    `version` = 0
WHERE `id` BETWEEN 7 AND 9;

INSERT INTO `blind_box_mood` (`box_id`, `mood`) VALUES
  (7, 'happy'), (7, 'bored'), (7, 'curious'),
  (8, 'emo'),   (8, 'curious'),
  (9, 'curious'), (9, 'emo'), (9, 'happy');

INSERT INTO `blind_box_scene` (`box_id`, `scene`) VALUES
  (7, 'food'), (7, 'photography'), (7, 'water'),
  (8, 'food'), (8, 'ancient_town'), (8, 'art'), (8, 'water'),
  (9, 'ancient_town'), (9, 'water'), (9, 'photography'), (9, 'art'), (9, 'food');

-- ── A2. 攻略线路池（category = guide，覆盖 3 个价位保底） ──
-- 保底校验：盒7(990) / 盒8(1990) / 盒9(2990)
--   >=990  ：全部 10 条合格
--   >=1990 ：102/103/104/105/106/109 合格
--   >=2990 ：103/106/109 合格
DELETE FROM `travel_route` WHERE `id` BETWEEN 100 AND 109;
INSERT INTO `travel_route`
  (`id`, `name`, `category`, `location`, `scene`, `image_url`, `value_cent`, `cost_cent`, `badge_id`,
   `highlight`, `include_json`, `mood_text`, `status`) VALUES
  (100, '成都熊猫美食三日攻略', 'guide', '四川 · 成都', 'food',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      990, NULL, 3, '火锅串串、熊猫基地动线、建设路小吃清单',
      CAST('["三日行程路线","火锅串串榜单","熊猫基地避峰时段"]' AS JSON),
      '成都的烟火气，从一份攻略开始', 'on'),
  (101, '长沙夜市烟火攻略', 'guide', '湖南 · 长沙', 'food',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      1290, NULL, 3, '坡子街夜市动线、茶颜悦色错峰攻略、文和友取号技巧',
      CAST('["夜市打卡动线","本地人小吃榜单","排队避峰技巧"]' AS JSON),
      '长沙的夜，越晚越有味道', 'on'),
  (102, '杭州西湖四季漫步攻略', 'guide', '浙江 · 杭州', 'water',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      1990, NULL, 12, '苏堤白堤分时人流动线、机位地图、龙井茶室清单',
      CAST('["分时游湖路线","拍照机位地图","茶室与素食清单"]' AS JSON),
      '西湖的美，要挑对时间和角度', 'on'),
  (103, '西安古都人文深度攻略', 'guide', '陕西 · 西安', 'ancient_town',
      'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=800&q=80',
      3990, NULL, 11, '陕历博预约攻略、城墙骑行路线、回坊美食地图',
      CAST('["博物馆预约动线","城墙骑行路线","回坊美食地图"]' AS JSON),
      '在长安，一步一千年', 'on'),
  (104, '重庆山城夜景摄影攻略', 'guide', '重庆 · 渝中', 'photography',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
      2590, NULL, 12, '洪崖洞最佳机位、长江索道时段、南山观景台路线',
      CAST('["夜景机位地图","索道乘坐时段","轻轨穿楼打卡点"]' AS JSON),
      '山城的夜景，值得为它爬坡上坎', 'on'),
  (105, '青岛海滨亲子三日攻略', 'guide', '山东 · 青岛', 'sea',
      'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=800&q=80',
      1990, NULL, 6, '栈桥赶海时刻表、亲子酒店选址、海鲜市场挑选指南',
      CAST('["赶海时刻表","亲子路线","海鲜挑选指南"]' AS JSON),
      '带娃看海，就要省心又尽兴', 'on'),
  (106, '大理环洱海旅拍攻略', 'guide', '云南 · 大理', 'photography',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
      2990, NULL, 12, '环海西路机位、喜洲日出时段、白族村落动线',
      CAST('["环洱海骑行路线","旅拍机位地图","白族村落打卡点"]' AS JSON),
      '去有风的地方，把风景装进相机', 'on'),
  (107, '景德镇陶艺手作文创攻略', 'guide', '江西 · 景德镇', 'art',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      1290, NULL, 5, '陶溪川夜市攻略、雕塑瓷厂淘货路线、拉坯体验预约',
      CAST('["陶溪川夜市攻略","淘瓷路线","拉坯体验预约技巧"]' AS JSON),
      '把一件手作带回日常，旅行就有了形状', 'on'),
  (108, '婺源篁岭春摄攻略', 'guide', '江西 · 上饶', 'photography',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      990, NULL, 12, '油菜花梯田机位、晒秋拍摄时段、古村动线',
      CAST('["花期机位地图","晒秋拍摄时段","古村游览动线"]' AS JSON),
      '春天的婺源，是调色盘打翻的样子', 'on'),
  (109, '洛阳汉服古都攻略', 'guide', '河南 · 洛阳', 'ancient_town',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      2990, NULL, 11, '洛邑古城汉服租赁指南、应天门灯光秀时段、龙门石窟动线',
      CAST('["汉服体验指南","应天门灯光秀时段","龙门石窟动线"]' AS JSON),
      '穿上汉服，做一天神都居民', 'on');

-- 攻略线路的攻略模板（guide 分类专用文案）
UPDATE `travel_route`
SET `guide_version` = 1,
    `guide_json` = JSON_OBJECT(
      'overview', `highlight`,
      'durationText', '电子攻略 · 即买即用',
      'paceText', '自由节奏，按攻略自行安排',
      'walkText', '按攻略建议每日 6–10 千步',
      'transitText', '攻略不含大交通，往返需自理',
      'season', '按攻略内推荐时段出行体验最佳',
      'weather', '出发前查看目的地天气，雨天优先走攻略内的室内备选点位。',
      'facts', JSON_ARRAY(
        JSON_OBJECT('label','攻略形式','value','电子图文攻略（开盒即得）'),
        JSON_OBJECT('label','适合人群','value','自由行旅行者、摄影与美食爱好者'),
        JSON_OBJECT('label','使用方式','value','开盒后在行程页查看，支持离线收藏'),
        JSON_OBJECT('label','更新说明','value','攻略按当前版本提供，不含人工接待服务')),
      'schedules', JSON_ARRAY(
        JSON_OBJECT('dayNo', 1, 'time', '开盒后', 'title', '阅读攻略', 'description', CONCAT('通读「', `name`, '」，标记想去的点位。')),
        JSON_OBJECT('dayNo', 1, 'time', '出行时', 'title', '实地打卡', 'description', `highlight`),
        JSON_OBJECT('dayNo', 1, 'time', '返程后', 'title', '复盘收藏', 'description', '在行程页记录足迹并解锁对应徽章。')),
      'spots', JSON_ARRAY(JSON_OBJECT('spotId', CONCAT('guide-', `id`), 'name', `location`, 'coverUrl', `image_url`, 'highlights', `highlight`, 'notice', '营业时间与预约要求以官方最新公告为准。', 'durationMinutes', 240)),
      'transport', JSON_ARRAY(JSON_OBJECT('title', '交通说明', 'description', '攻略提供市内交通建议，不含往返大交通与接驳服务。')),
      'dining', JSON_ARRAY(JSON_OBJECT('title', '餐饮说明', 'description', '攻略含美食清单与人均预算参考，餐费自理。')),
      'lodging', JSON_ARRAY(),
      'budgetItems', JSON_ARRAY(JSON_OBJECT('name', '攻略内预算参考（门票/餐饮/市内交通）', 'amount', 300, 'required', false)),
      'checklist', `include_json`,
      'planB', '如遇点位临时关闭，按攻略内的备选清单调整顺序即可。',
      'safetyTips', JSON_ARRAY('提前确认景点预约要求', '夜间出行注意安全', '保管好证件与订单信息'),
      'faqs', JSON_ARRAY(JSON_OBJECT('question', '攻略包含交通和门票吗？', 'answer', '不包含。攻略提供路线、清单与避坑建议，交通门票需自理。'))
    )
WHERE `id` BETWEEN 100 AND 109;

-- ═══════════════════════════════════════════════════════
-- B. 现有分类线路扩充（按地点 · 类型 · 省市）
-- ═══════════════════════════════════════════════════════

-- ── B1. nearby 周边游（江西周边，票面须盖过盒1-3保底 120/160/200 元） ──
DELETE FROM `travel_route` WHERE `id` BETWEEN 110 AND 114;
INSERT INTO `travel_route`
  (`id`, `name`, `category`, `location`, `scene`, `image_url`, `value_cent`, `cost_cent`, `badge_id`,
   `highlight`, `include_json`, `mood_text`, `status`) VALUES
  (110, '篁岭晒秋古村一日', 'nearby', '上饶 · 婺源', 'village',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      25800, NULL, 8, '晒秋人家、梯田花海、天街古巷',
      CAST('["景区接驳","晒秋体验","向导"]' AS JSON),
      '晒秋的颜色，是秋天最暖的注脚', 'on'),
  (111, '明月山温泉轻徒步一日', 'nearby', '宜春 · 温汤镇', 'mountain',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
      23800, NULL, 2, '青云栈道、山涧温泉、富硒温泉足浴',
      CAST('["往返交通","温泉门票","向导"]' AS JSON),
      '爬完山再泡温泉，一身疲惫都化了', 'on'),
  (112, '滕王阁赣江夜游一日', 'nearby', '南昌 · 东湖区', 'art',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      16800, NULL, 5, '滕王阁夜景、赣江游船、一江两岸灯光秀',
      CAST('["滕王阁门票","赣江游船","讲解"]' AS JSON),
      '落霞与孤鹜齐飞，秋水共长天一色', 'on'),
  (113, '龙虎山仙水岩一日', 'nearby', '鹰潭 · 龙虎山', 'adventure',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      19800, NULL, 9, '丹霞碧水、悬棺表演、竹筏漂流',
      CAST('["往返交通","竹筏漂流","门票"]' AS JSON),
      '丹山碧水间，藏着道法自然', 'on'),
  (114, '庐山锦绣谷徒步一日', 'nearby', '九江 · 牯岭镇', 'mountain',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
      28800, NULL, 2, '锦绣谷云雾、如琴湖花径、仙人洞步道',
      CAST('["山上接驳","门票","向导"]' AS JSON),
      '云雾从山谷升起，脚步也跟着轻了', 'on');

-- ── B2. province 省内游（票面须盖过盒4保底 380 元） ──
DELETE FROM `travel_route` WHERE `id` BETWEEN 115 AND 118;
INSERT INTO `travel_route`
  (`id`, `name`, `category`, `location`, `scene`, `image_url`, `value_cent`, `cost_cent`, `badge_id`,
   `highlight`, `include_json`, `mood_text`, `status`) VALUES
  (115, '武功山云中草原二日', 'province', '萍乡 · 武功山', 'camp',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      42800, NULL, 10, '高山草甸、云海日出、星空帐篷',
      CAST('["大巴往返","住宿","门票","向导"]' AS JSON),
      '睡在云上，醒来就是日出', 'on'),
  (116, '婺源篁岭晒秋二日', 'province', '上饶 · 婺源', 'village',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      46800, NULL, 8, '晒秋全景、梯田日出、徽派古村漫居',
      CAST('["大巴往返","民宿","门票","向导"]' AS JSON),
      '在徽派山居里，把日子过慢一点', 'on'),
  (117, '井冈山红色研学二日', 'province', '吉安 · 井冈山', 'red',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      39800, NULL, 7, '黄洋界哨口、革命博物馆、红军餐体验',
      CAST('["大巴往返","住宿","门票","研学导师"]' AS JSON),
      '走一段红军路，懂得来时的路', 'on'),
  (118, '庐山避暑漫居二日', 'province', '九江 · 庐山', 'mountain',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
      52000, NULL, 2, '牯岭镇漫步、三叠泉瀑布、美庐别墅',
      CAST('["大巴往返","山上住宿","门票","向导"]' AS JSON),
      '山中的两天，比平地上的一周更长', 'on');

-- ── B3. cross 跨省游（票面须盖过盒5保底 750 元） ──
DELETE FROM `travel_route` WHERE `id` BETWEEN 119 AND 122;
INSERT INTO `travel_route`
  (`id`, `name`, `category`, `location`, `scene`, `image_url`, `value_cent`, `cost_cent`, `badge_id`,
   `highlight`, `include_json`, `mood_text`, `status`) VALUES
  (119, '桂林漓江山水三日', 'cross', '广西 · 桂林', 'water',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      88000, NULL, 12, '漓江竹筏、兴坪古镇、阳朔西街日落',
      CAST('["当地接驳","两晚住宿","竹筏票","行程服务"]' AS JSON),
      '山水甲天下，是眼睛的假期', 'on'),
  (120, '张家界天门山三日', 'cross', '湖南 · 张家界', 'mountain',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
      96800, NULL, 9, '玻璃栈道、天门洞、百龙天梯',
      CAST('["当地接驳","两晚住宿","门票索道","向导"]' AS JSON),
      '把心跳留在玻璃栈道上', 'on'),
  (121, '西安古都博物三日', 'cross', '陕西 · 西安', 'ancient_town',
      'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=800&q=80',
      108000, NULL, 11, '兵马俑深度讲解、城墙骑行、大唐不夜城',
      CAST('["当地接驳","两晚住宿","门票讲解","行程服务"]' AS JSON),
      '千年古都，值得慢慢读', 'on'),
  (122, '厦门鼓浪屿海滨三日', 'cross', '福建 · 厦门', 'sea',
      'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=800&q=80',
      82800, NULL, 6, '鼓浪屿琴声、环岛路骑行、沙坡尾日落',
      CAST('["轮渡票","两晚民宿","行程服务"]' AS JSON),
      '海风把烦恼都吹散了', 'on');

-- ── B4. theme 主题专线（票面须盖过盒6保底 150 元） ──
DELETE FROM `travel_route` WHERE `id` BETWEEN 123 AND 126;
INSERT INTO `travel_route`
  (`id`, `name`, `category`, `location`, `scene`, `image_url`, `value_cent`, `cost_cent`, `badge_id`,
   `highlight`, `include_json`, `mood_text`, `status`) VALUES
  (123, '长沙夜市美食专线', 'theme', '湖南 · 长沙', 'food',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      19800, NULL, 3, '坡子街、文和友、糖油粑粑巡礼',
      CAST('["市内交通","美食打卡","向导讲解"]' AS JSON),
      '辣得过瘾，才算到过长沙', 'on'),
  (124, '成都火锅串串专线', 'theme', '四川 · 成都', 'food',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      22800, NULL, 3, '建设路小吃、玉林串串、盖碗茶闲坐',
      CAST('["市内交通","三餐打卡","向导讲解"]' AS JSON),
      '麻辣是成都递出的名片', 'on'),
  (125, '景德镇陶艺文创专线', 'theme', '江西 · 景德镇', 'art',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      17800, NULL, 5, '陶溪川夜市、拉坯体验、雕塑瓷厂淘瓷',
      CAST('["市内交通","拉坯体验","向导讲解"]' AS JSON),
      '泥土在手里转出生活的形状', 'on'),
  (126, '重庆洪崖洞夜景摄影线', 'theme', '重庆 · 渝中', 'photography',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
      18800, NULL, 12, '洪崖洞夜色、长江索道、山城步道',
      CAST('["市内交通","机位向导","夜景拍摄"]' AS JSON),
      '现实版千与千寻，就在夜色里', 'on');

-- ── B5. 新线路攻略模板（与 seed.sql 同构，按分类生成） ──
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
      'spots', JSON_ARRAY(JSON_OBJECT('spotId', CONCAT('route-', `id`), 'name', `location`, 'coverUrl', `image_url`, 'highlights', `highlight`, 'notice', '开放时间与现场安排以出发前通知为准。', 'durationMinutes', 240)),
      'transport', JSON_ARRAY(JSON_OBJECT('title', '集合与接驳', 'description', '出发前一天在行程页确认集合点和车辆信息。')),
      'dining', JSON_ARRAY(JSON_OBJECT('title', '餐饮安排', 'description', '以订单服务内容和出发前通知为准。')),
      'lodging', CASE WHEN `category` IN ('province', 'cross') THEN JSON_ARRAY(JSON_OBJECT('title', '住宿安排', 'description', '入住信息在出发前通知中确认。')) ELSE JSON_ARRAY() END,
      'budgetItems', JSON_ARRAY(JSON_OBJECT('name', '个人机动消费', 'amount', 100, 'required', false)),
      'checklist', `include_json`,
      'planB', '如遇天气或景区临时调整，以安全为先切换室内点位，并保留返程时间。',
      'safetyTips', JSON_ARRAY('提前确认天气和集合时间', '不进入未开放区域', '保管好证件与订单信息'),
      'faqs', JSON_ARRAY(JSON_OBJECT('question', '集合信息在哪里查看？', 'answer', '出发前一天在行程详情和订单通知中查看。'))
    )
WHERE `id` BETWEEN 110 AND 126;

-- ── B6. 校验各分类线路池保底覆盖（执行后人工核对） ──
-- SELECT category, COUNT(*) cnt, MIN(value_cent) min_v
--   FROM travel_route WHERE status = 'on' GROUP BY category;
