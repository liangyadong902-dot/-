import type {
  AiRecipe,
  BadgeItem,
  BannerItem,
  BlindBox,
  GuestUser,
  KitchenSettings,
  OrderItem,
  PersonType,
  QuizItem,
  RefundItem,
  TravelRoute,
  TripItem,
} from '@/types/kitchen'

export const SEED_BOXES: BlindBox[] = [
  { id: 'box_1', rank: 'TOP1', name: '周边微度假盲盒', category: 'nearby', tag: '周边游', desc: '1天短途，周末说走就走', price: 99, guarantee: 120, moods: ['happy', 'emo', 'bored'], img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80', status: 'on', sort: 90, opens: 186 },
  { id: 'box_2', rank: 'TOP2', name: '隐世古村慢生活盒', category: 'nearby', tag: '周边游', desc: '青石古街，非遗打糍粑', price: 129, guarantee: 160, moods: ['emo', 'curious'], img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', status: 'on', sort: 80, opens: 142 },
  { id: 'box_3', rank: 'TOP3', name: '山野露营观星盲盒', category: 'nearby', tag: '周边游', desc: '湖畔星空，篝火治愈夜', price: 159, guarantee: 200, moods: ['emo', 'curious', 'bored'], img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', status: 'on', sort: 70, opens: 98 },
  { id: 'box_4', rank: 'HOT', name: '省内仙山问道二日', category: 'province', tag: '省内游', desc: '云海奇峰，探秘古建', price: 299, guarantee: 380, moods: ['happy', 'curious'], img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', status: 'on', sort: 60, opens: 54 },
  { id: 'box_5', rank: 'NEW', name: '跨省限定冒险盲盒', category: 'cross', tag: '跨省游', desc: '大山大河，说走就走', price: 599, guarantee: 750, moods: ['bored', 'curious'], img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', status: 'on', sort: 50, opens: 21 },
  { id: 'box_6', rank: 'HOT', name: '老城寻味美食专线', category: 'theme', tag: '主题专线', desc: '街角早茶，烟火气', price: 119, guarantee: 150, moods: ['happy', 'bored'], img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', status: 'off', sort: 40, opens: 67 },
]

export const SEED_ROUTES: TravelRoute[] = [
  { id: 'r1', name: '渼陂古村非遗一日游', dest: '吉安 · 青原区', category: 'nearby', value: 148, badge: '古村', moodText: '古村的风会吹走所有烦恼', highlights: '青石街、打糍粑、老樟树', includes: '交通、午餐、向导', status: 'on', img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80', draws: 86 },
  { id: 'r2', name: '云雾茶山徒步采风', dest: '武夷山周边', category: 'nearby', value: 135, badge: '山野', moodText: '穿过云雾，听见心跳', highlights: '茶垄步道、云海', includes: '交通、茶歇、向导', status: 'on', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80', draws: 71 },
  { id: 'r3', name: '湖畔星空营地之夜', dest: '仙女湖畔', category: 'nearby', value: 218, badge: '露营', moodText: '星空不说话，但够温暖', highlights: '星空、篝火、湖岸', includes: '帐篷、晚餐、向导', status: 'on', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80', draws: 44 },
  { id: 'r4', name: '三清山松云问道二日', dest: '上饶 · 玉山', category: 'province', value: 420, badge: '徽派', moodText: '站在高处，天地开朗', highlights: '栈道、云海日出', includes: '大巴、住宿、门票', status: 'on', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', draws: 29 },
  { id: 'r5', name: '大理苍山洱海', dest: '云南 · 大理', category: 'cross', value: 880, badge: '文艺', moodText: '去有风的地方重新开始', highlights: '苍山索道、海东日落', includes: '往返交通、一晚民宿', status: 'on', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', draws: 12 },
  { id: 'r6', name: '西关深巷寻味记', dest: '广州 · 西关', category: 'theme', value: 168, badge: '美食', moodText: '烟火气是最好的良药', highlights: '早茶、骑楼、糖水', includes: '向导、三餐打卡', status: 'off', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', draws: 33 },
]

export const SEED_BADGES: BadgeItem[] = [
  { name: '古村', mark: '村', unlock: 86, routes: 1 },
  { name: '山野', mark: '山', unlock: 71, routes: 1 },
  { name: '美食', mark: '味', unlock: 33, routes: 1 },
  { name: '徽派', mark: '徽', unlock: 29, routes: 1 },
  { name: '文艺', mark: '文', unlock: 12, routes: 1 },
  { name: '海滨', mark: '海', unlock: 0, routes: 0 },
  { name: '红色', mark: '红', unlock: 8, routes: 0 },
  { name: '乡村', mark: '乡', unlock: 19, routes: 0 },
  { name: '探险', mark: '探', unlock: 6, routes: 0 },
  { name: '露营', mark: '营', unlock: 44, routes: 1 },
  { name: '研学', mark: '学', unlock: 4, routes: 0 },
  { name: '摄影', mark: '影', unlock: 11, routes: 0 },
]

export const SEED_BANNERS: BannerItem[] = [
  { id: 'bn1', title: '暑期限定 · 开盒即省', sub: '票面保底 120%，乡村文旅再记 1 公里', tag: '价值保底', to: '分类 / 周边游', on: true, img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80' },
  { id: 'bn2', title: 'emo 日专场', sub: '隐世古村与湖畔露营，把皱抚平', tag: '心情匹配', to: '心情 / emo', on: true, img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80' },
]

export const SEED_ORDERS: OrderItem[] = [
  { no: 'T20260917001', user: '小鹿', phone: '138****1201', box: '周边微度假盲盒', pay: 99, ch: '支付宝沙箱', st: 'opened', route: '渼陂古村非遗一日游', time: '09-17 08:12' },
  { no: 'T20260917002', user: '阿茶', phone: '139****8830', box: '隐世古村慢生活盒', pay: 129, ch: '支付宝沙箱', st: 'pending_pay', route: '—', time: '09-17 09:40' },
  { no: 'T20260917003', user: '北北', phone: '136****4412', box: '山野露营观星盲盒', pay: 159, ch: '支付宝沙箱', st: 'opened', route: '湖畔星空营地之夜', time: '09-17 10:05' },
  { no: 'T20260917004', user: '林深', phone: '150****9921', box: '跨省限定冒险盲盒', pay: 599, ch: '支付宝沙箱', st: 'refunded', route: '抽奖失败自动退', time: '09-16 21:18' },
  { no: 'T20260917005', user: '米粒', phone: '187****6608', box: '老城寻味美食专线', pay: 119, ch: '支付宝沙箱', st: 'paid', route: '待开盒', time: '09-17 11:22' },
  { no: 'T20260917006', user: '清清', phone: '131****7754', box: '省内仙山问道二日', pay: 299, ch: '支付宝沙箱', st: 'cancelled', route: '超时取消', time: '09-16 19:02' },
]

export const SEED_REFUNDS: RefundItem[] = [
  { no: 'R20260917001', order: 'T20260915018', user: '阿茶', reason: '未出行退换 · 行程冲突', amount: 129, type: '人工', st: 'wait' },
  { no: 'R20260917002', order: 'T20260916004', user: '北北', reason: '保底兜底申请', amount: 159, type: '人工', st: 'wait' },
  { no: 'R20260917003', order: 'T20260916011', user: '米粒', reason: '计划变更', amount: 99, type: '人工', st: 'wait' },
  { no: 'R20260916008', order: 'T20260917004', user: '林深', reason: '抽奖失败自动退', amount: 599, type: '自动', st: 'done' },
]

export const SEED_TRIPS: TripItem[] = [
  { user: '小鹿', route: '渼陂古村非遗一日游', dest: '吉安 · 青原区', date: '2026-09-17', price: 99, val: 148, ok: true },
  { user: '北北', route: '湖畔星空营地之夜', dest: '仙女湖畔', date: '2026-09-17', price: 159, val: 218, ok: true },
  { user: '林深', route: '（已退款）大理苍山洱海', dest: '云南 · 大理', date: '2026-09-16', price: 599, val: 880, ok: false },
]

export const SEED_USERS: GuestUser[] = [
  { id: 10021, name: '小鹿', wxName: '', phone: '138****1201', ch: '手机', trips: 5, title: '探索者', spend: 612, saved: 148, last: '今天 08:12', on: true, mood: 'emo', person: '山野治愈家' },
  { id: 10044, name: '阿茶', wxName: '阿茶不想上班', phone: '139****8830', ch: '微信', trips: 1, title: '旅行新手', spend: 129, saved: 19, last: '今天 09:40', on: true, mood: 'curious', person: '人文记录者' },
  { id: 10007, name: '北北', wxName: '', phone: '136****4412', ch: '手机', trips: 12, title: '旅行家', spend: 2380, saved: 640, last: '今天 10:05', on: true, mood: 'happy', person: '追风冒险者' },
  { id: 10058, name: '林深', wxName: '林深见鹿', phone: '150****9921', ch: '微信', trips: 3, title: '探索者', spend: 918, saved: 210, last: '昨天 21:18', on: false, mood: 'bored', person: '城市探险家' },
  { id: 10063, name: '米粒', wxName: '', phone: '187****6608', ch: '手机', trips: 2, title: '旅行新手', spend: 218, saved: 41, last: '今天 11:22', on: true, mood: 'happy', person: '未测试' },
]

export const SEED_QUIZ: QuizItem[] = [
  { n: 1, q: '周末突然多出一天，你更想？', a: ['钻进山里听风', '城市里找一家没去过的馆子', '报个说走就走的跨城', '去古镇把巷子走完'] },
  { n: 2, q: '旅行照片里你最常拍？', a: ['树和云', '店招与夜景', '悬崖或公路', '祠堂与老物件'] },
  { n: 3, q: '开盒前你的心情更接近？', a: ['想被治愈', '想被烟火气填满', '想被未知掀翻', '想被故事接住'] },
  { n: 4, q: '和旅伴走散两小时，你？', a: ['坐在石头上等', '钻进巷子继续逛', '把这当成冒险', '去博物馆坐坐'] },
  { n: 5, q: '盲盒最吸引你的是？', a: ['山野与营地', '美食专线', '跨省大场景', '非遗与人文'] },
]

export const SEED_PERSONS: PersonType[] = [
  { type: 'nature', name: '山野治愈家', rec: '山野徒步、古村慢游、露营观星' },
  { type: 'city', name: '城市探险家', rec: '城市探店、美食专线、都市潮玩' },
  { type: 'adventure', name: '追风冒险者', rec: '跨省限定、户外探险、小众秘境' },
  { type: 'culture', name: '人文记录者', rec: '红色研学、非遗体验、古镇人文' },
]

export const SEED_AI: AiRecipe = {
  greet: '我是小途。把心情交给路就好，古村、山野或湖畔，今晚就能出发。',
  prompt: '你是途个惊喜的旅行搭子小途。禁止虚构价格，禁止替用户开盒。用短句、温度、不鸡汤。',
  quick: ['我想散散心', '周末有什么一日游', '一个人走安全吗'],
  fallback: ['模型在揉面，先看看周边微度假盲盒。', '信号被山挡住了。古村慢生活通常不会错。'],
  diary: '用 {线路名称}、{目的地}、{亮点} 写一段 80 字左右的旅行日记，像手写在牛皮纸上。',
}

export const SEED_SETTINGS: KitchenSettings = {
  guarantee: '开盒线路票面价值不低于盲盒售价的 120%。',
  moodCopy: '选心情，配盲盒。匹配的是标签，不是算命。',
  village: 1,
  timeout: 15,
  levels: [
    [0, 2, '旅行新手'],
    [3, 7, '探索者'],
    [8, 99, '旅行家'],
  ],
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
