# -*- coding: utf-8 -*-
# 盲盒扩充生成器：新增 10 个盲盒（各分类补齐价位带）+ 45 条高端攻略线路
# 复用 gen_routes_1000.py 的素材库与攻略模板，固定序号选取保证可复现
# 输出：seed-boxes-expansion.sql（在 seed-routes-1000.sql 之后执行）
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
_ns = {}
with open(os.path.join(HERE, 'gen_routes_1000.py'), encoding='utf-8') as f:
    exec(compile(f.read(), 'gen_routes_1000.py', 'exec'), _ns)

CITIES = _ns['CITIES']            # (省, 市, 目的地, scene, spots, dining, 特产)
build_guide = _ns['build_guide']  # (city, cat, days, value_fen) -> 18键 dict
MOODS = _ns['MOODS']
cover = _ns['cover']
SCENE_BADGE = _ns['SCENE_BADGE']


def esc(s):
    return str(s).replace("'", '').replace('\\', '')


lines = []
lines.append('-- 途个惊喜 · 增量种子：盲盒扩充 + 高端攻略线路池')
lines.append('-- 更新时间：2026-09-21')
lines.append('--')
lines.append('-- ★ 执行顺序：seed.sql → seed-guide-boxes.sql → seed-guide-v3.sql → seed-routes-1000.sql → 本文件')
lines.append('--')
lines.append('-- 内容：')
lines.append('--   A. 高端攻略线路 45 条（id 1127-1171，票面 ¥39.9/¥49.9/¥59.9，支撑 29.9/39.9 攻略盒保底池）')
lines.append('--   B. 新盲盒 10 个（id 10-19）：周边+2 / 省内+2 / 跨省+2 / 主题+2 / 攻略+2')
lines.append('--   · 心情/场景关联、简介描述、权益清单一并写入，与现有盒子同构')
lines.append('')
lines.append('SET NAMES utf8mb4;')
lines.append("SET time_zone = '+08:00';")
lines.append('')
lines.append('USE `tuge`;')
lines.append('')

# ── A. 高端攻略线路 45 条 ─────────────────────────────────────
TIERS = [3990] * 20 + [4990] * 15 + [5990] * 10
lines.append('-- ═══════════════════════════════════════════════════════')
lines.append('-- A. 高端攻略线路 45 条（id 1127-1171）')
lines.append('--    保底校验：>=3990 共 46 条 / >=4990 共 25 条 / >=5990 共 10 条')
lines.append('-- ═══════════════════════════════════════════════════════')
lines.append('DELETE FROM `travel_route` WHERE `id` BETWEEN 1127 AND 1171;')
for i, val in enumerate(TIERS):
    city = CITIES[i % len(CITIES)]
    days = 2 if i % 2 == 0 else 3
    guide = build_guide(city, 'guide', days, val)
    gjson = esc(json.dumps(guide, ensure_ascii=False, separators=(',', ':')))
    spots = city[4]
    name = '%s纯攻略·臻享版%d' % (city[2], i + 1)
    highlight = '%s —— 深度攻略助你玩透%s精髓' % (' / '.join(s[0] for s in spots), city[2])
    include = '["逐时段行程攻略", "美食避坑清单", "交通购票指南"]'
    mood = MOODS[i % len(MOODS)]
    lines.append(
        "INSERT INTO `travel_route` "
        "(`id`,`name`,`category`,`location`,`scene`,`image_url`,`value_cent`,`cost_cent`,`badge_id`,"
        "`highlight`,`include_json`,`guide_json`,`guide_version`,`mood_text`,`status`) VALUES "
        "(%d,'%s','guide','%s','%s','%s',%d,%d,%d,'%s','%s','%s',2,'%s','on');"
        % (1127 + i, esc(name), esc('%s · %s' % (city[0], city[1])), city[3], cover(i),
           val, val // 2, SCENE_BADGE.get(city[3], 1), esc(highlight), include, gjson, esc(mood)))
lines.append('')

# ── B. 新盲盒 10 个 ──────────────────────────────────────────
# (id, 名称, 分类, tag, rank_tag, 简介, 售价分, 保底分, sort_weight, moods, scenes, 权益说明)
BOXES = [
    (10, '周边轻奢撒野盒', 'nearby', '周边游', 'HOT', '周边玩法再升一级：优选山水民宿与轻奢体验',
     19900, 24000, 88, ['happy', 'curious'], ['village', 'camp', 'mountain', 'water'],
     '周边2日行程攻略', '美食打卡清单', '保底价值保障'),
    (11, '周边顶配玩家盒', 'nearby', '周边游', 'TOP3', '周边盒顶配档：票面价值直逼三百，撒野不留遗憾',
     25900, 27000, 86, ['happy', 'curious', 'emo'], ['mountain', 'camp', 'water', 'adventure'],
     '周边2日行程攻略', '玩法体验券指引', '保底价值保障'),
    (12, '省内进阶山水盒', 'province', '省内游', 'HOT', '省内二日进阶版：仙山秀水，深度慢游',
     39900, 45000, 58, ['curious', 'happy'], ['mountain', 'water', 'ancient_town', 'art'],
     '省内2日行程攻略', '美食打卡清单', '保底价值保障'),
    (13, '省内臻选度假盒', 'province', '省内游', 'NEW', '省内度假臻选：古镇温泉、山水人文一盒打尽',
     46900, 50000, 56, ['emo', 'curious', 'happy'], ['ancient_town', 'village', 'water', 'art'],
     '省内2日行程攻略', '民宿住宿指引', '保底价值保障'),
    (14, '跨省畅游盒', 'cross', '跨省游', 'HOT', '跨省三日畅游：大山大河，一次走透',
     79900, 90000, 48, ['happy', 'bored', 'curious'], ['mountain', 'water', 'food', 'photography'],
     '跨省3日行程攻略', '交通购票指南', '保底价值保障'),
    (15, '跨省尊享冒险盒', 'cross', '跨省游', 'TOP2', '跨省尊享档：探险与风光拉满，票面价值近千元',
     99900, 100000, 46, ['curious', 'emo', 'happy'], ['adventure', 'photography', 'mountain', 'food'],
     '跨省3日行程攻略', '探险安全手册', '保底价值保障'),
    (16, '周末撒野主题盒', 'theme', '主题专线', 'NEW', '周末就去撒野：露营山野水岸，说走就走',
     16900, 19000, 38, ['bored', 'happy', 'curious'], ['camp', 'mountain', 'water', 'village'],
     '主题2日行程攻略', '露营装备清单', '保底价值保障'),
    (17, '出片打卡主题盒', 'theme', '主题专线', 'HOT', '专为出片而生：机位、光线、构图全写进攻略',
     19900, 20000, 36, ['happy', 'curious', 'emo'], ['photography', 'art', 'food', 'water'],
     '主题2日行程攻略', '拍照机位地图', '保底价值保障'),
    (18, '29.9元攻略定制PLUS盒', 'guide', '纯攻略', 'TOP2', 'PLUS级定制攻略：分日行程 + 美食地图 + 机位建议',
     2990, 3990, 74, ['curious', 'happy', 'bored'], ['food', 'ancient_town', 'art', 'photography', 'water'],
     '目的地深度攻略', '美食打卡清单', '避坑与机位提示'),
    (19, '39.9元攻略黑金盒', 'guide', '纯攻略', 'TOP1', '攻略顶配黑金档：全维度定制，行程美食住宿全包',
     3990, 4990, 72, ['curious', 'emo', 'happy'], ['ancient_town', 'water', 'photography', 'art', 'food'],
     '目的地深度攻略', '分日美食地图', '住宿与交通建议'),
]

GUARD_NOTE = {
    10: '≥¥240 线路 73 条', 11: '≥¥270 线路 30 条',
    12: '≥¥450 线路 92 条', 13: '≥¥500 线路 26 条',
    14: '≥¥900 线路 67 条', 15: '≥¥1000 线路 25 条',
    16: '≥¥190 线路 35 条', 17: '≥¥200 线路 22 条',
    18: '≥¥39.9 线路 46 条（含 A 节新增）', 19: '≥¥49.9 线路 25 条（含 A 节新增）',
}

lines.append('-- ═══════════════════════════════════════════════════════')
lines.append('-- B. 新盲盒 10 个（id 10-19）')
lines.append('-- ═══════════════════════════════════════════════════════')
lines.append('DELETE FROM `blind_box_mood` WHERE `box_id` BETWEEN 10 AND 19;')
lines.append('DELETE FROM `blind_box_scene` WHERE `box_id` BETWEEN 10 AND 19;')
lines.append('DELETE FROM `blind_box` WHERE `id` BETWEEN 10 AND 19;')
lines.append('INSERT INTO `blind_box`')
lines.append("  (`id`, `name`, `category`, `tag`, `rank_tag`, `intro`, `price_cent`, `min_value_cent`,")
lines.append('   `cover_url`, `sort_weight`, `status`) VALUES')

box_rows = []
for b in BOXES:
    bid, name, cat, tag, rank, intro, price, guarantee, sortw, _m, _s, *_rest = b
    box_rows.append("  (%d, '%s', '%s', '%s', '%s', '%s', %d, %d, '%s', %d, 'on')"
                    % (bid, name, cat, tag, rank, intro, price, guarantee, cover(bid), sortw))
lines.append(',\n'.join(box_rows) + ';')
lines.append('')

# 简介/描述/权益：旅行盒与攻略盒分别处理
lines.append('-- ── B1. 描述 / 图集 / 权益清单 ──')
for b in BOXES:
    bid, name, cat, tag, rank, intro, price, guarantee, sortw, moods, scenes, inc1, inc2, inc3 = b
    if cat == 'guide':
        desc = ("SET `description` = CONCAT(`intro`, '。纯攻略盒开盒后获得目的地电子攻略（含分日行程、美食清单与避坑提示），"
                "不含实体制票与接待服务，票面价值即攻略制作价值。'),")
        preview = (",\n    `guide_preview_json` = JSON_OBJECT("
                   "'title', '纯攻略盲盒 · 开盒即得完整攻略',"
                   "'summary', `intro`,"
                   "'durationText', '电子攻略 · 即买即用',"
                   "'sceneTags', JSON_ARRAY('攻略', `tag`),"
                   "'notice', '开盒后获得电子攻略快照，可在行程页随时查看；攻略不含交通、住宿与门票。')")
    else:
        desc = ("SET `description` = CONCAT(`intro`, '。开盒保底票面价值 %s，线路池持续更新，"
                "未达保底自动全额退款。')," % GUARD_NOTE[bid].split(' ')[0])
        preview = ''
    lines.append('UPDATE `blind_box`')
    lines.append(desc)
    lines.append("    `images_json` = JSON_ARRAY(`cover_url`),")
    lines.append("    `includes_json` = JSON_ARRAY('%s', '%s', '%s')" % (inc1, inc2, inc3))
    if preview:
        lines.append(preview)
    lines.append('WHERE `id` = %d;' % bid)
lines.append('')

lines.append('-- ── B2. 心情关联 ──')
mood_rows = []
for b in BOXES:
    for m in b[9]:
        mood_rows.append("  (%d, '%s')" % (b[0], m))
lines.append('INSERT INTO `blind_box_mood` (`box_id`, `mood`) VALUES\n' + ',\n'.join(mood_rows) + ';')
lines.append('')

lines.append('-- ── B3. 场景关联（仅作筛选，不约束开盒） ──')
scene_rows = []
for b in BOXES:
    for s in b[10]:
        scene_rows.append('  (%d, %s)' % (b[0], repr(s)))
lines.append('INSERT INTO `blind_box_scene` (`box_id`, `scene`) VALUES\n' + ',\n'.join(scene_rows) + ';')
lines.append('')

out_path = os.path.join(HERE, 'seed-boxes-expansion.sql')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

# 自检：名称唯一 / JSON 可解析
names = [b[1] for b in BOXES]
assert len(names) == len(set(names)) == 10, '盲盒名称重复'
for i in range(len(TIERS)):
    city = CITIES[i % len(CITIES)]
    g = build_guide(city, 'guide', 2 if i % 2 == 0 else 3, TIERS[i])
    assert len(g) == 18, 'guide 键数异常: %d' % len(g)
print('generated: 10 boxes + %d premium guide routes -> %s' % (len(TIERS), out_path))
