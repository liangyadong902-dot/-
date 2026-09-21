(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const CAT = {
    nearby: "周边游",
    province: "省内游",
    cross: "跨省游",
    theme: "主题专线",
  };
  const MOOD = { happy: "开心", emo: "emo", bored: "无聊", curious: "迷茫" };
  const ORDER_ST = {
    pending_pay: ["待支付", "wait"],
    paid: ["已支付", "ok"],
    opened: ["已开盒", "ok"],
    cancelled: ["已取消", "wait"],
    refunded: ["已退款", "bad"],
  };

  const I = {
    dash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>',
    box: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13"/><path d="M12 8c-2-3 2-5 4-3s0 3-4 3z"/></svg>',
    route: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
    badge: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3 14.5 8l5.5.8-4 3.9.9 5.5L12 16l-4.9 2.2.9-5.5-4-3.9L9.5 8z"/></svg>',
    banner: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l5-4 4 3 9-7"/></svg>',
    ai: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3"/><path d="M6 19c1.5-3 4-4.5 6-4.5S16.5 16 18 19"/><path d="M19 8h2M3 8h2M12 2v1"/></svg>',
    quiz: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8V14"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg>',
    order: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 12h8M8 16h5"/></svg>',
    refund: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 12a8 8 0 1 0 2-5.3"/><path d="M4 4v5h5"/></svg>',
    trip: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    stats: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    set: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.5 1.2H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    pal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/></svg>',
  };

  const NAV = [
    { g: "橱窗", items: [
      { id: "dash", name: "工作台", en: "OVEN", icon: I.dash },
      { id: "stats", name: "数据统计", en: "STATS", icon: I.stats },
    ]},
    { g: "配方", items: [
      { id: "boxes", name: "盲盒管理", en: "BOX", icon: I.box },
      { id: "routes", name: "线路管理", en: "ROUTE", icon: I.route },
      { id: "badges", name: "徽章管理", en: "BADGE", icon: I.badge },
      { id: "banners", name: "运营位", en: "BANNER", icon: I.banner },
    ]},
    { g: "酵母", items: [
      { id: "ai", name: "AI 搭子", en: "XIAOTU", icon: I.ai },
      { id: "quiz", name: "人格测试", en: "DNA", icon: I.quiz },
    ]},
    { g: "内容", items: [
      { id: "community", name: "社区内容", en: "COMMUNITY", icon: I.banner },
      { id: "comments", name: "评论审核", en: "COMMENTS", icon: I.order },
      { id: "checkins", name: "打卡记录", en: "CHECK-IN", icon: I.route },
    ]},
    { g: "账单", items: [
      { id: "orders", name: "订单支付", en: "ORDER", icon: I.order },
      { id: "refunds", name: "退款审核", en: "REFUND", icon: I.refund },
      { id: "trips", name: "行程记录", en: "TRIP", icon: I.trip },
    ]},
    { g: "客人", items: [
      { id: "users", name: "用户管理", en: "GUEST", icon: I.user },
    ]},
    { g: "后场", items: [
      { id: "settings", name: "系统设置", en: "SET", icon: I.set },
      { id: "tokens", name: "视觉规范", en: "PALETTE", icon: I.pal },
    ]},
  ];

  const TITLES = {
    dash: ["工作台", "用户端业务状态与运营待办集中处理"],
    boxes: ["盲盒管理", "对应用户端商品中心、详情页与开盒入口"],
    routes: ["线路管理", "开盒随机池、行程详情与逐景点攻略"],
    badges: ["徽章管理", "图鉴里的十二枚印章"],
    banners: ["运营位", "用户端首页那条鼠尾草横幅"],
    ai: ["AI 搭子 · 小途", "人设、降级话术与日记配方"],
    quiz: ["人格测试", "五道题，四种旅行人格"],
    community: ["社区内容", "用户发布、内容审核与精选推荐"],
    comments: ["评论审核", "评论举报与内容处置"],
    checkins: ["打卡记录", "地点、照片与成就进度"],
    orders: ["订单与支付", "待支付 → 已支付 → 已开盒"],
    trips: ["行程记录", "开盒后的线路快照与攻略联查"],
    users: ["用户管理", "身份 / 偏好 / 资产 / 成长 四层档案"],
    stats: ["数据统计", "支付成功且未退款才计入成交"],
    settings: ["系统设置", "规则文案、等级、公益与账号"],
    tokens: ["视觉规范", "与用户端共用奶油纸张与鼠尾草品牌系统"],
  };

  const db = {
    boxes: [
      { id: "box_1", rank: "TOP1", name: "周边微度假盲盒", category: "nearby", tag: "周边游", desc: "1天短途，周末说走就走", price: 99, guarantee: 120, moods: ["happy", "emo", "bored"], img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80", status: "on", sort: 90, opens: 186 },
      { id: "box_2", rank: "TOP2", name: "隐世古村慢生活盒", category: "nearby", tag: "周边游", desc: "青石古街，非遗打糍粑", price: 129, guarantee: 160, moods: ["emo", "curious"], img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", status: "on", sort: 80, opens: 142 },
      { id: "box_3", rank: "TOP3", name: "山野露营观星盲盒", category: "nearby", tag: "周边游", desc: "湖畔星空，篝火治愈夜", price: 159, guarantee: 200, moods: ["emo", "curious", "bored"], img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", status: "on", sort: 70, opens: 98 },
      { id: "box_4", rank: "HOT", name: "省内仙山问道二日", category: "province", tag: "省内游", desc: "云海奇峰，探秘古建", price: 299, guarantee: 380, moods: ["happy", "curious"], img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", status: "on", sort: 60, opens: 54 },
      { id: "box_5", rank: "NEW", name: "跨省限定冒险盲盒", category: "cross", tag: "跨省游", desc: "大山大河，说走就走", price: 599, guarantee: 750, moods: ["bored", "curious"], img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", status: "on", sort: 50, opens: 21 },
      { id: "box_6", rank: "HOT", name: "老城寻味美食专线", category: "theme", tag: "主题专线", desc: "街角早茶，烟火气", price: 119, guarantee: 150, moods: ["happy", "bored"], img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", status: "off", sort: 40, opens: 67 },
    ],
    routes: [
      { id: "r1", name: "渼陂古村非遗一日游", dest: "吉安 · 青原区", category: "nearby", value: 148, badge: "古村", moodText: "古村的风会吹走所有烦恼", highlights: "青石街、打糍粑、老樟树", includes: "交通、午餐、向导", status: "on", img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80", draws: 86 },
      { id: "r2", name: "云雾茶山徒步采风", dest: "武夷山周边", category: "nearby", value: 135, badge: "山野", moodText: "穿过云雾，听见心跳", highlights: "茶垄步道、云海", includes: "交通、茶歇、向导", status: "on", img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80", draws: 71 },
      { id: "r3", name: "湖畔星空营地之夜", dest: "仙女湖畔", category: "nearby", value: 218, badge: "露营", moodText: "星空不说话，但够温暖", highlights: "星空、篝火、湖岸", includes: "帐篷、晚餐、向导", status: "on", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", draws: 44 },
      { id: "r4", name: "三清山松云问道二日", dest: "上饶 · 玉山", category: "province", value: 420, badge: "徽派", moodText: "站在高处，天地开朗", highlights: "栈道、云海日出", includes: "大巴、住宿、门票", status: "on", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", draws: 29 },
      { id: "r5", name: "大理苍山洱海", dest: "云南 · 大理", category: "cross", value: 880, badge: "文艺", moodText: "去有风的地方重新开始", highlights: "苍山索道、海东日落", includes: "往返交通、一晚民宿", status: "on", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", draws: 12 },
      { id: "r6", name: "西关深巷寻味记", dest: "广州 · 西关", category: "theme", value: 168, badge: "美食", moodText: "烟火气是最好的良药", highlights: "早茶、骑楼、糖水", includes: "向导、三餐打卡", status: "off", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", draws: 33 },
    ],
    badges: [
      { name: "古村", mark: "村", unlock: 86, routes: 1 }, { name: "山野", mark: "山", unlock: 71, routes: 1 },
      { name: "美食", mark: "味", unlock: 33, routes: 1 }, { name: "徽派", mark: "徽", unlock: 29, routes: 1 },
      { name: "文艺", mark: "文", unlock: 12, routes: 1 }, { name: "海滨", mark: "海", unlock: 0, routes: 0 },
      { name: "红色", mark: "红", unlock: 8, routes: 0 }, { name: "乡村", mark: "乡", unlock: 19, routes: 0 },
      { name: "探险", mark: "探", unlock: 6, routes: 0 }, { name: "露营", mark: "营", unlock: 44, routes: 1 },
      { name: "研学", mark: "学", unlock: 4, routes: 0 }, { name: "摄影", mark: "影", unlock: 11, routes: 0 },
    ],
    banners: [
      { id: "bn1", title: "暑期限定 · 开盒即省", sub: "票面保底 120%，乡村文旅再记 1 公里", tag: "价值保底", to: "分类 / 周边游", on: true, img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80" },
      { id: "bn2", title: "emo 日专场", sub: "隐世古村与湖畔露营，把皱抚平", tag: "心情匹配", to: "心情 / emo", on: true, img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80" },
    ],
    orders: [
      { no: "T20260917001", user: "小鹿", phone: "138****1201", box: "周边微度假盲盒", pay: 99, ch: "支付宝沙箱", st: "opened", route: "渼陂古村非遗一日游", time: "09-17 08:12" },
      { no: "T20260917002", user: "阿茶", phone: "139****8830", box: "隐世古村慢生活盒", pay: 129, ch: "支付宝沙箱", st: "pending_pay", route: "—", time: "09-17 09:40" },
      { no: "T20260917003", user: "北北", phone: "136****4412", box: "山野露营观星盲盒", pay: 159, ch: "支付宝沙箱", st: "opened", route: "湖畔星空营地之夜", time: "09-17 10:05" },
      { no: "T20260917004", user: "林深", phone: "150****9921", box: "跨省限定冒险盲盒", pay: 599, ch: "支付宝沙箱", st: "refunded", route: "抽奖失败自动退", time: "09-16 21:18" },
      { no: "T20260917005", user: "米粒", phone: "187****6608", box: "老城寻味美食专线", pay: 119, ch: "支付宝沙箱", st: "paid", route: "待开盒", time: "09-17 11:22" },
      { no: "T20260917006", user: "清清", phone: "131****7754", box: "省内仙山问道二日", pay: 299, ch: "支付宝沙箱", st: "cancelled", route: "超时取消", time: "09-16 19:02" },
    ],
    refunds: [
      { no: "R20260917001", order: "T20260915018", user: "阿茶", reason: "未出行退换 · 行程冲突", amount: 129, type: "人工", st: "wait" },
      { no: "R20260917002", order: "T20260916004", user: "北北", reason: "保底兜底申请", amount: 159, type: "人工", st: "wait" },
      { no: "R20260917003", order: "T20260916011", user: "米粒", reason: "计划变更", amount: 99, type: "人工", st: "wait" },
      { no: "R20260916008", order: "T20260917004", user: "林深", reason: "抽奖失败自动退", amount: 599, type: "自动", st: "done" },
    ],
    trips: [
      { user: "小鹿", route: "渼陂古村非遗一日游", dest: "吉安 · 青原区", date: "2026-09-17", price: 99, val: 148, ok: true },
      { user: "北北", route: "湖畔星空营地之夜", dest: "仙女湖畔", date: "2026-09-17", price: 159, val: 218, ok: true },
      { user: "林深", route: "（已退款）大理苍山洱海", dest: "云南 · 大理", date: "2026-09-16", price: 599, val: 880, ok: false },
    ],
    users: [
      { id: 10021, name: "小鹿", wxName: "", phone: "138****1201", ch: "手机", trips: 5, title: "探索者", spend: 612, saved: 148, last: "今天 08:12", on: true, mood: "emo", person: "山野治愈家" },
      { id: 10044, name: "阿茶", wxName: "阿茶不想上班", phone: "139****8830", ch: "微信", trips: 1, title: "旅行新手", spend: 129, saved: 19, last: "今天 09:40", on: true, mood: "curious", person: "人文记录者" },
      { id: 10007, name: "北北", wxName: "", phone: "136****4412", ch: "手机", trips: 12, title: "旅行家", spend: 2380, saved: 640, last: "今天 10:05", on: true, mood: "happy", person: "追风冒险者" },
      { id: 10058, name: "林深", wxName: "林深见鹿", phone: "150****9921", ch: "微信", trips: 3, title: "探索者", spend: 918, saved: 210, last: "昨天 21:18", on: false, mood: "bored", person: "城市探险家" },
      { id: 10063, name: "米粒", wxName: "", phone: "187****6608", ch: "手机", trips: 2, title: "旅行新手", spend: 218, saved: 41, last: "今天 11:22", on: true, mood: "happy", person: "未测试" },
    ],
    quiz: [
      { n: 1, q: "周末突然多出一天，你更想？", a: ["钻进山里听风", "城市里找一家没去过的馆子", "报个说走就走的跨城", "去古镇把巷子走完"] },
      { n: 2, q: "旅行照片里你最常拍？", a: ["树和云", "店招与夜景", "悬崖或公路", "祠堂与老物件"] },
      { n: 3, q: "开盒前你的心情更接近？", a: ["想被治愈", "想被烟火气填满", "想被未知掀翻", "想被故事接住"] },
      { n: 4, q: "和旅伴走散两小时，你？", a: ["坐在石头上等", "钻进巷子继续逛", "把这当成冒险", "去博物馆坐坐"] },
      { n: 5, q: "盲盒最吸引你的是？", a: ["山野与营地", "美食专线", "跨省大场景", "非遗与人文"] },
    ],
    persons: [
      { type: "nature", name: "山野治愈家", rec: "山野徒步、古村慢游、露营观星" },
      { type: "city", name: "城市探险家", rec: "城市探店、美食专线、都市潮玩" },
      { type: "adventure", name: "追风冒险者", rec: "跨省限定、户外探险、小众秘境" },
      { type: "culture", name: "人文记录者", rec: "红色研学、非遗体验、古镇人文" },
    ],
    ai: {
      greet: "我是小途。把心情交给路就好，古村、山野或湖畔，今晚就能出发。",
      prompt: "你是途个惊喜的旅行搭子小途。禁止虚构价格，禁止替用户开盒。用短句、温度、不鸡汤。",
      quick: ["我想散散心", "周末有什么一日游", "一个人走安全吗"],
      fallback: ["模型在揉面，先看看周边微度假盲盒。", "信号被山挡住了。古村慢生活通常不会错。"],
      diary: "用 {线路名称}、{目的地}、{亮点} 写一段 80 字左右的旅行日记，像手写在牛皮纸上。",
    },
    settings: {
      guarantee: "开盒线路票面价值不低于盲盒售价的 120%。",
      moodCopy: "选心情，配盲盒。匹配的是标签，不是算命。",
      village: 1,
      timeout: 15,
      levels: [
        [0, 2, "旅行新手"],
        [3, 7, "探索者"],
        [8, 99, "旅行家"],
      ],
    },
    filters: { boxCat: "all", boxSt: "all", orderSt: "all" },
  };

  const ROUTE_GUIDES = {
    r1: {
      summary: "线路以渼陂古村的建筑、宗族文化和红色历史为主线，大部分为青石板路。重点是在核心建筑与非遗体验间留出观察时间。",
      weather: "古村青石板遇雨易滑，夏季巷道闷热。建议穿防滑鞋，阵雨天避免进入无管理的老宅和河埂边缘。",
      schedule: [["08:00", "集合前往渼陂", "核对订单与返程集合点，途中由领队介绍古村参观礼仪。", "车程以通知为准"], ["09:30", "古村入口与村史导读", "从村落格局、水系与古街走向建立整体认知。", "停留约 30 分钟"], ["10:10", "宗祠建筑群", "观看天井、木构件和门楣细节，不跨越封闭区域。", "停留约 50 分钟"], ["11:20", "青石古街与午餐", "沿主街慢行，在规范经营点用餐。", "用餐约 70 分钟"], ["13:10", "红色旧址区", "根据当日开放情况参观旧址与陈列。", "安静参观"], ["14:30", "非遗体验与返程", "完成当日非遗体验，清点物品后集合。", "预计 16:30 返程"]],
      facts: [["预计步行", "5–7 km"], ["路面情况", "青石板为主"], ["主要台阶", "宗祠与老宅入口"], ["信号情况", "主街基本稳定"], ["适合人群", "人文、建筑、摄影爱好者"], ["慎重选择", "雨天行动不便者"]],
      attractions: [["古村入口与村史区", "30 分钟", "先看村落总平面与历史沿革，理解宗祠、古街和水系的关系。", "村落格局、水塘与入口视角", "先拍导览图，离线保存回程集合点"], ["宗祠建筑群", "50 分钟", "重点观察天井采光、木构造、门楣与建筑轴线。", "木构件、天井、门楣", "室内不开闪光灯，不触摸老构件"], ["青石古街", "60–90 分钟", "主街与支巷尺度不同，适合慢行观察老宅门面和居民生活。", "早晨光影、古街纵深感", "拍摄居民和室内生活前先征得同意"], ["红色旧址区", "45–60 分钟", "按历史时间线阅读当日开放的陈列空间。", "历史时间线与保留建筑", "保持安静，服从室内拍摄规定"], ["非遗体验坊", "60–90 分钟", "项目根据供应商排期确认，先听演示再上手。", "制作过程与当地生活技艺", "有食物过敏或手部伤口要提前说明"]],
      living: [["午餐", "优先选择明码标价的当地家常菜，用餐前确认是否包含在订单权益中。"], ["补给", "主街周边可购买饮用水，进入支巷前先完成补给。"], ["休息", "宗祠与古街之间安排固定休息，不建议坐在居民门槛。"]],
      planB: [["小雨", "保留宗祠、红色旧址和非遗体验，减少河埂与支巷步行。"], ["旧址未开放", "改为村史导读与建筑外观路线，不擅自进入封闭区域。"], ["体验调整", "原定项目不可用时，替换为同等时长的当地技艺体验。"]],
      tips: ["古建筑内部不使用强闪光。", "雨后青石板下坡时放慢速度。", "不进入未标明开放的民宅和院落。", "开放空间和体验项目以当日管理为准。"]
    },
    r2: {
      summary: "以茶园步道、岩茶制作与云雾景观为主线的徒步采风行程。重点是理解茶园地形、步行节奏与制茶工序。",
      weather: "茶山雾气、阵雨和湿滑路面较常见，防滑鞋和轻量雨具是必带项。",
      schedule: [["08:00", "集合出发", "确认徒步装备、饮水和返程时间。", "轻装出发"], ["09:30", "茶园入口热身", "了解步道分岔和安全边界。", "20 分钟"], ["10:00", "茶垄步道徒步", "沿开放步道上行，中途安排摄影停留。", "约 2 小时"], ["12:20", "茶山午餐", "补充热量与水分。", "60 分钟"], ["13:40", "岩茶工坊", "了解萎凋、做青、焙火等基本工序。", "70 分钟"], ["15:10", "云雾观景点与返程", "能见度允许时观景，雨天改为工坊深度体验。", "16:30 前下山"]],
      facts: [["预计步行", "7–9 km"], ["累计上下", "约 2–3 小时"], ["路面情况", "土路、石阶与茶垄边道"], ["信号情况", "山坳路段可能较弱"], ["适合人群", "徒步、茶文化、摄影爱好者"], ["慎重选择", "膝关节不适或易滑倒者"]],
      attractions: [["茶园入口与导览点", "20 分钟", "确认线路、卫生间和集合点，同时认识当地茶树与地形。", "茶垄线条与山谷视野", "进山前完成补给和上厕所"], ["茶垄步道", "90–120 分钟", "保持单列行走，不踩入种植区和未开放小路。", "曲线茶垄、云雾与山体层次", "湿滑路段不边走边拍摄"], ["茶山观景台", "30–40 分钟", "能见度好时观察茶园与山谷关系。", "宽景、逆光茶垄", "不翻越护栏，风大时收好帽子"], ["岩茶工坊", "60–90 分钟", "从鲜叶到焙火的工序导读，记录香气与滋味差异。", "制茶工具、焙火工序、试饮", "咖啡因敏感者不要连续浓茶试饮"]],
      living: [["午餐", "优先选热食和易消化主食。"], ["饮水", "入山前至少准备 800 ml 饮水。"], ["能量补给", "少量坚果、能量棒即可。"]],
      planB: [["起雾", "取消高处观景，保留安全步道与茶厂体验。"], ["持续降雨", "将长距离徒步替换为工坊与室内试饮。"], ["高温", "徒步提前到早间并增加补水点。"]],
      tips: ["不采摘、不踩茶垄。", "不使用三脚架长时占道。", "试饮前说明咖啡因敏感情况。", "开放情况以当日通知为准。"]
    },
    r3: {
      summary: "围绕仙女湖湖畔散步、日落观景、露营体验和夜间观星展开，准备重点是夜间温差、露水和照明。",
      weather: "湖边傍晚降温快。观星受云量影响，不保证每次都有晴朗星空。",
      schedule: [["13:30", "营地签到与安全说明", "确认帐篷区、卫生间、紧急出口和水边安全线。", "30 分钟"], ["14:10", "湖畔栈道慢行", "沿开放栈道观景。", "60 分钟"], ["15:30", "搭建与营地体验", "完成帐篷、防潮和照明检查。", "70 分钟"], ["17:10", "日落观景与晚餐", "提前到观景区并完成保暖。", "不占用安全通道"], ["19:30", "星空导读", "暗适应后再开始观察。", "云多时改夜间自然导读"], ["21:00", "营地收尾", "清点火源、垃圾与贵重物品。", "不单独前往水边"]],
      facts: [["预计步行", "3–5 km"], ["地形特点", "平缓栈道与草地"], ["夜间温差", "高于白天体感预期"], ["通信信号", "营地内基本可用"], ["适合人群", "露营新手、亲子、情侣"], ["慎重选择", "怕冷、对虫类敏感者"]],
      attractions: [["营地签到区", "30 分钟", "熟悉营地分区、用电规则和紧急集合点。", "营地全景与湖岸方向", "先记安全信息再拍照"], ["湖畔栈道", "50–60 分钟", "慢行观察水面、风向和湖岸植被。", "湖面反光、栈道线条", "准备遮阳和手机防掉绳"], ["日落观景区", "40–60 分钟", "以领队当天建议的安全区域为准。", "湖面色温变化、剪影", "不使用未固定的高位支架"], ["星空营区", "60–90 分钟", "先进行暗适应，再辨认亮星与星座。", "低光环境与湖畔夜色", "使用低亮照明，避免直射他人"]],
      living: [["晚餐", "烧烤食材需充分加热。"], ["保暖", "携带长袖外套和防风层。"], ["防虫与照明", "带个人防虫用品和备用照明。"]],
      planB: [["多云", "改为星图导读或湖畔夜间声景观察。"], ["强风", "取消帐篷和水边停留。"], ["降雨", "保留室内体验并提前结束夜间环节。"]],
      tips: ["夜间不单独前往岸线。", "帐篷拍摄不影响消防通道。", "星空与日落不是可控承诺。", "离场前检查明火和电源。"]
    },
    r4: {
      summary: "两日山岳线以三清山高山栈道和花岗岩峰林为核心，结合索道与步行环线，景点取舍根据体力、客流和能见度调整。",
      weather: "山上风大、温度低且天气切换快，必须准备防风防雨层。",
      schedule: [["D1 08:00", "抵达索道站与检票", "核对末班索道与天气通知。", "避开高峰排队"], ["D1 10:00", "南清园峰林线", "串联东方女神、巨蟒出山等观景方向。", "4–6 小时"], ["D1 17:00", "返回住宿区", "天黑前结束主步道。", "完成拉伸"], ["D2 07:30", "早间观景 / 替代线", "能见度好时早间观景。", "不摸黑走未开放路段"], ["D2 09:30", "西海岸高空栈道", "根据客流与体力完成精华段。", "2–3 小时"], ["D2 14:30", "下山与返程", "末班索道前留足排队时间。", "提前确认返程班次"]],
      facts: [["预计步行", "12–16 km / 2 天"], ["台阶强度", "较多且连续"], ["索道环节", "受风速与检修影响"], ["通信信号", "高山路段可能不稳定"], ["适合人群", "有基础体力的山岳景观爱好者"], ["慎重选择", "恐高、膝伤或心肺不适者"]],
      attractions: [["索道站与入山口", "30–60 分钟", "了解步道开放、末班索道与天气预警。", "山势总览与线路标识", "保留下山时间余量"], ["东方女神观景区", "30–40 分钟", "从侧向观景角度识别峰体轮廓。", "花岗岩轮廓与云海背景", "不翻越护栏寻找角度"], ["巨蟒出山观景区", "30–40 分钟", "观察垂直石柱与峰林的尺度对比。", "独立石柱、层叠山体", "风大时收好松散物品"], ["南清园步道", "3–4 小时", "台阶和观景平台交替，保持均匀速度。", "奇峰、古松、山谷层次", "每 45–60 分钟短休"], ["西海岸高空栈道", "2–3 小时", "暴露感较强，恐高者走靠山侧。", "高山栈道、云海与日落方向", "雷电、大风或结冰时不进入"]],
      living: [["山上补给", "自带水和少量高能量食品。"], ["住宿", "山上或山下住宿影响次日出发时间。"], ["晚间恢复", "入住后补水、拉伸和检查足部。"]],
      planB: [["索道停运", "无法安全替代时不强行徒步上山。"], ["低能见度", "优先林下步道和近距离峰林观景。"], ["体力不足", "在可返回节点缩短环线。"]],
      tips: ["确认索道末班时间。", "以现场天气管理为准。", "连续下台阶时控制速度。", "不在狭窄处架设拍摄设备。"]
    },
    r5: {
      summary: "三天线围绕大理古城、苍山景观与洱海沿线展开，在高原环境中保持较慢节奏，抵达当天不安排高强度活动。",
      weather: "大理紫外线强、早晚温差明显，苍山与洱海边风力可能增大。",
      schedule: [["D1 14:00", "抵达与古城慢游", "入住后先休息、补水。", "不赶景点"], ["D2 08:30", "苍山索道区", "根据开放、风力和预约时段完成体验。", "保留改线时间"], ["D2 14:30", "洱海生态廊道", "选择一段慢行或骑行。", "2–3 小时"], ["D2 18:00", "洱海日落方向", "按风力与云量决定停留。", "安全优先"], ["D3 09:00", "喜洲古镇与田野视角", "以建筑与当地生活为主。", "2 小时"], ["D3 13:30", "返程换乘", "取行李后预留大交通余量。", "航班提前 2 小时"]],
      facts: [["预计步行", "12–18 km / 3 天"], ["环境特点", "高原日照与昼夜温差"], ["主要交通", "索道、接驳、步行 / 骑行"], ["行李建议", "20 寸行李箱"], ["适合人群", "喜欢风景、慢游和摄影"], ["慎重选择", "近期呼吸系统不适者"]],
      attractions: [["大理古城", "2–3 小时", "抵达当天以低强度慢行为主，记住酒店方向和回程路线。", "城门轴线、街巷、傍晚光线", "商品和拍摄服务先确认价格"], ["苍山索道及开放步道", "3–4 小时", "根据索道开放和风力选择可行路线。", "山脊、洱海俯瞰与高山植被", "准备平地替代方案"], ["洱海生态廊道", "2–3 小时", "选一段慢行或骑行，将体力留给返程。", "湿地、水面反光、苍山背景", "骑行佩戴头盔并避让行人"], ["喜洲古镇", "2 小时", "以建筑立面、院落格局与田野环境为观察重点。", "白族建筑、古镇街巷、田野边界", "未开放民居不进入"]],
      living: [["高原饮食", "刚抵达时优先清淡热食和充足饮水。"], ["住宿位置", "古城内步行方便，城外便于交通衔接。"], ["行李寄存", "第三天先确认最晚取件时间。"]],
      planB: [["苍山索道停运", "改为古城人文或洱海廊道安全段。"], ["洱海边大风", "取消骑行和长时间水边停留。"], ["大交通延误", "优先保障住宿和返程。"]],
      tips: ["首日不过量饮酒。", "骑行不进入生态保护区。", "索道开放以现场信息为准。", "持续防晒和补水。"]
    },
    r6: {
      summary: "以广州西关的骑楼、水系、粤剧与老广餐食为主线，采用少量多次的品尝方式，重点是街区脉络和饮食文化。",
      weather: "广州高温高湿，建议轻便穿着、持续补水，雨季携带折叠伞。",
      schedule: [["08:30", "西关早茶", "少量多次品尝开始。", "70 分钟"], ["10:00", "泮塘五约与荔枝湾涌", "沿水系了解西关聚落。", "90 分钟"], ["12:00", "骑楼街区寻味", "品尝一至两种小吃。", "90 分钟"], ["14:00", "粤剧与西关文化展馆", "了解粤剧表演、服饰和舞台文化。", "60–90 分钟"], ["15:40", "永庆坊街区慢游", "观察骑楼、街巷与公共空间。", "70 分钟"], ["17:00", "糖水收尾与返程", "根据体感与排队情况选择收尾品类。", "公共交通返程"]],
      facts: [["预计步行", "5–7 km"], ["品尝节奏", "4–6 个小份项目"], ["主要路面", "城市人行道与骑楼"], ["卫生间", "商场、展馆与公共设施"], ["适合人群", "美食、城市史、建筑爱好者"], ["慎重选择", "严重食物过敏未备注者"]],
      attractions: [["西关早茶点", "60–75 分钟", "确认权益套餐和自费项目，以小份分享方式品尝。", "点心笼、茶市氛围、老店空间", "过敏要逐项确认"], ["泮塘五约", "40–60 分钟", "关注河涌、社区街巷和传统聚落结构。", "岭南聚落、水系、骑楼细节", "不阻挡居民门口"], ["荔枝湾涌", "40–60 分钟", "沿开放步道观察水系与桥梁。", "河涌、桥梁、岭南植被", "雨天注意河边湿滑"], ["粤剧文化展陈空间", "60–90 分钟", "从行当、服饰、乐器和舞台阅读展陈。", "粤剧服饰、舞台美术、园林空间", "录像以现场规定为准"], ["永庆坊街区", "60–90 分钟", "观察旧建筑保留与新业态介入。", "骑楼、街巷、公共空间更新", "高峰时注意贵重物品"]],
      living: [["品尝原则", "少量多次，先确认价格与过敏原。"], ["补水", "高温高湿时每小时补水。"], ["休息", "中午安排室内展馆或用餐环节。"]],
      planB: [["雨天", "保留早茶、粤剧展陈和骑楼有遮蔽路段。"], ["店铺临休", "使用同类且明码标价的店铺替代。"], ["高温", "室外步行集中到早间和傍晚。"]],
      tips: ["等位时不阻塞骑楼。", "每次点餐重复确认过敏信息。", "展馆开放以现场信息为准。", "冷藏伴手礼先评估返程时长。"]
    }
  };

  const COMMUNITY_POSTS = [
    { id:"p1", title:"青石板上的慢生活，真的会把皱抚平", author:"小鹿", place:"吉安 · 青原区", likes:1287, comments:186, collects:342, topic:"#古村慢生活", boxId:"box_2", time:"09-17 18:20", imgs:[db.routes[0].img], text:"开盒开到了渼陂古村，票面 148 比售价高了一截。\n早上八点的青石板还带着露水，没做攻略反而遇见了最舒服的一下午。" },
    { id:"p2", title:"湖边搭好帐篷，等一场不赶时间的日落", author:"北北", place:"仙女湖畔", likes:964, comments:112, collects:268, topic:"#小众秘境", boxId:"box_3", time:"09-17 17:06", imgs:[db.routes[2].img], text:"帐篷、晚餐、向导都包含在内。傍晚湖面像一块烧红的铁，风一吹又凉下来。" },
    { id:"p3", title:"一个人的周末，也可以有很具体的风", author:"阿茶", place:"武夷山周边", likes:742, comments:94, collects:156, topic:"#一个人旅行", boxId:"box_1", time:"09-17 12:42", imgs:[db.routes[1].img], text:"茶垄步道走了两个小时，云雾从脚边漫过去。一个人走也安心，线路含向导和交通。" },
    { id:"p4", title:"把烟火气装进一日游里", author:"米粒", place:"广州 · 西关", likes:613, comments:77, collects:129, topic:"#美食探店", boxId:"box_6", time:"09-16 20:18", imgs:[db.routes[5].img], text:"早茶、骑楼、糖水，一条线吃下来。老城寻味专线是真的懂吃。" },
    { id:"p5", title:"爬了三清山，云在脚下走", author:"林深", place:"上饶 · 玉山", likes:428, comments:52, collects:97, topic:"#周末去哪儿", boxId:"box_4", time:"09-16 16:30", imgs:[db.routes[3].img], text:"五点半起床看日出，栈道上全是等云海的人。站在高处的时候，天地确实会开朗一点。" },
    { id:"p6", title:"第一次跨省开盒，去有风的地方", author:"小满", place:"云南 · 大理", likes:356, comments:41, collects:88, topic:"#盲盒开箱", boxId:"box_5", time:"09-15 19:12", imgs:[db.routes[4].img], text:"苍山索道上去的时候心里有点空，洱海边又慢慢被填满。票面 880，保底是真的在兜住我。" }
  ];

  const LEDGER_KEY = "TUGE_LEDGER";
  const ADMIN_STORE_KEY = "TUGE_ADMIN_STORE";
  const adminState = { communityFilter: "all", moderation: {}, routeGuides: {} };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }
  function readUserStore() {
    try {
      return JSON.parse(localStorage.getItem("TUGE_APP_STORE") || "{}");
    } catch (e) {
      return {};
    }
  }
  function loadAdminState() {
    try {
      const saved = JSON.parse(localStorage.getItem(ADMIN_STORE_KEY) || "{}");
      adminState.communityFilter = saved.communityFilter || "all";
      adminState.moderation = saved.moderation && typeof saved.moderation === "object" ? saved.moderation : {};
      adminState.routeGuides = saved.routeGuides && typeof saved.routeGuides === "object" ? saved.routeGuides : {};
      Object.entries(adminState.routeGuides).forEach(([id, guide]) => {
        if (ROUTE_GUIDES[id] && guide) ROUTE_GUIDES[id] = { ...ROUTE_GUIDES[id], ...guide };
      });
    } catch (e) {}
  }
  function saveAdminState() {
    localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(adminState));
  }
  function guideForRoute(route) {
    return route ? ROUTE_GUIDES[route.id] || null : null;
  }
  function routeCompleteness(route) {
    const guide = guideForRoute(route);
    if (!guide) return 0;
    const checks = [guide.summary, guide.weather, guide.schedule, guide.facts, guide.attractions, guide.living, guide.planB, guide.tips];
    return Math.round(checks.filter((item) => Array.isArray(item) ? item.length : String(item || "").trim()).length / checks.length * 100);
  }
  function boxesForRoute(route) {
    return db.boxes.filter((box) => box.category === route.category && route.value >= box.guarantee);
  }
  function boxCoverage(box) {
    const categoryRoutes = db.routes.filter((route) => route.category === box.category && route.status === "on");
    const eligible = categoryRoutes.filter((route) => route.value >= box.guarantee);
    return { total: categoryRoutes.length, eligible: eligible.length, ok: eligible.length > 0 };
  }
  function mergedTrips() {
    const s = readUserStore();
    const extra = (s.trips || []).map((trip) => ({
      id: trip.id,
      orderId: trip.orderId || "",
      routeId: trip.routeId || "",
      user: (s.user && s.user.nickname) || "途友",
      wxName: (s.user && (s.user.wxName || (s.user.channel === "微信" ? s.user.nickname : ""))) || "",
      ch: (s.user && s.user.channel) || "",
      route: trip.name,
      dest: trip.dest,
      date: trip.date,
      price: trip.price,
      val: trip.val,
      ok: trip.valid !== false,
      live: true,
    }));
    return [...extra, ...db.trips.map((trip, i) => ({ ...trip, id: "mock_trip_" + i }))];
  }
  function communityPosts() {
    const s = readUserStore();
    const userPosts = (s.posts || []).map((post) => ({
      ...post,
      time: post.time || "刚刚",
      comments: (post.comments || 0) + (((s.comments || {})[post.id] || []).length),
      source: "用户端",
    }));
    const builtins = COMMUNITY_POSTS.map((post) => ({ ...post, source: "演示内容" }));
    return [...userPosts, ...builtins].map((post, index) => {
      const defaultStatus = post.source === "用户端" ? "review" : (post.id === "p1" ? "featured" : "published");
      return { ...post, status: adminState.moderation[post.id] || defaultStatus, sort: index };
    });
  }
  function moderationLabel(status) {
    return {
      review: ["待审核", "wait"], published: ["已发布", "ok"], featured: ["精选", "ok"], down: ["已下架", "bad"],
    }[status] || [status, "wait"];
  }

  loadAdminState();

  function liveLedger() {
    try {
      return Object.assign({ orders: [], refunds: [] }, JSON.parse(localStorage.getItem(LEDGER_KEY) || "{}"));
    } catch (e) {
      return { orders: [], refunds: [] };
    }
  }
  function saveLiveLedger(l) {
    localStorage.setItem(LEDGER_KEY, JSON.stringify({ orders: l.orders || [], refunds: l.refunds || [] }));
  }
  function maskLivePhone(p) {
    const s = String(p || "");
    if (s.length < 7) return s || "未绑定";
    return s.slice(0, 3) + "****" + s.slice(-4);
  }
  function wxNickOf(obj) {
    if (!obj) return "";
    if (obj.wxName) return obj.wxName;
    if (obj.loginCh === "微信" || obj.ch === "微信" || obj.channel === "微信") {
      return obj.name || obj.user || obj.nickname || "";
    }
    const hit = db.users.find((u) => u.ch === "微信" && u.name === (obj.name || obj.user));
    return hit ? (hit.wxName || hit.name) : "";
  }
  function guestCell(obj) {
    const name = obj.name || obj.user || "途友";
    const wx = wxNickOf(obj);
    const phone = obj.phone || "";
    const wxLine = wx ? `<div style="font-size:11px;color:var(--sage-deep);font-weight:700;">微信名 ${wx}</div>` : "";
    const phoneLine = (wx && (!phone || phone === "未绑定"))
      ? `<div style="font-size:11px;color:var(--muted);">未绑定手机</div>`
      : (phone ? `<div style="font-size:11px;color:var(--muted);">${phone}</div>` : "");
    return `${name}${wxLine}${phoneLine}`;
  }
  function liveAppUser() {
    try {
      const s = JSON.parse(localStorage.getItem("TUGE_APP_STORE") || "{}");
      if (!s.loggedIn || !s.user) return null;
      const u = s.user;
      const trips = (s.trips || []).filter((t) => t.valid !== false);
      const spend = (s.orders || []).filter((o) => o.st === "opened" || o.st === "paid").reduce((n, o) => n + (o.pay || 0), 0);
      let title = "旅行新手";
      if (trips.length >= 8) title = "旅行家";
      else if (trips.length >= 3) title = "探索者";
      return {
        id: 10901,
        name: u.nickname || "途友",
        wxName: u.wxName || (u.channel === "微信" ? u.nickname : ""),
        phone: u.phone ? maskLivePhone(u.phone) : "未绑定",
        ch: u.channel || "手机",
        trips: trips.length,
        title,
        spend,
        saved: s.savedTotal || 0,
        orders: (s.orders || []).length,
        posts: (s.posts || []).length,
        badges: (s.badges || []).length,
        last: "刚刚",
        on: true,
        mood: s.mood || "all",
        person: (s.personality && s.personality.name) || "未测试",
        live: true,
      };
    } catch (e) {
      return null;
    }
  }
  function mergedUsers() {
    const live = liveAppUser();
    return live ? [live, ...db.users] : db.users;
  }
  function mergedOrders() {
    const live = liveLedger().orders || [];
    const nos = new Set(live.map((o) => o.no));
    return [...live, ...db.orders.filter((o) => !nos.has(o.no))];
  }
  function mergedRefunds() {
    const live = liveLedger().refunds || [];
    const nos = new Set(live.map((r) => r.no));
    return [...live, ...db.refunds.filter((r) => !nos.has(r.no))];
  }
  function patchUserTrips(orderNo) {
    try {
      const raw = localStorage.getItem("TUGE_APP_STORE");
      if (!raw) return;
      const s = JSON.parse(raw);
      const t = (s.trips || []).find((x) => x.orderId === orderNo);
      if (t && t.valid !== false) {
        t.valid = false;
        s.savedTotal = Math.max(0, (s.savedTotal || 0) - ((t.val || 0) - (t.price || 0)));
      }
      (s.orders || []).forEach((o) => {
        if (o.no === orderNo) { o.st = "refunded"; o.refundSt = "done"; }
      });
      localStorage.setItem("TUGE_APP_STORE", JSON.stringify(s));
    } catch (e) {}
  }

  let page = "dash";

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("on");
    setTimeout(() => el.classList.remove("on"), 1800);
  }

  function hourGreet() {
    const h = new Date().getHours();
    if (h < 11) return "Good Morning!";
    if (h < 17) return "Good Afternoon!";
    return "Good Evening!";
  }

  function catIcon(kind) {
    const map = {
      boxes: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none"><rect x="8" y="16" width="28" height="20" rx="3" stroke="#6C7E58" stroke-width="1.7"/><path d="M22 16v20M8 22h28" stroke="#6C7E58" stroke-width="1.5"/><path d="M16 16c0-6 12-6 12 0" stroke="#6C7E58" stroke-width="1.5"/></svg>',
      routes: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none"><path d="M22 36s10-8.5 10-16a10 10 0 1 0-20 0c0 7.5 10 16 10 16z" stroke="#6C7E58" stroke-width="1.7"/><circle cx="22" cy="20" r="3" stroke="#6C7E58" stroke-width="1.5"/></svg>',
      orders: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none"><rect x="10" y="12" width="24" height="22" rx="3" stroke="#6C7E58" stroke-width="1.7"/><path d="M16 12V9h12v3M16 20h12M16 25h8" stroke="#6C7E58" stroke-width="1.5"/></svg>',
      refunds: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none"><rect x="12" y="10" width="20" height="24" rx="3" stroke="#6C7E58" stroke-width="1.7"/><path d="M18 18h8M18 23h8M18 28h5" stroke="#6C7E58" stroke-width="1.5"/></svg>',
    };
    return map[kind];
  }

  function renderNav() {
    $("#nav").innerHTML = NAV.map((g) => `
      <div class="nav-label">${g.g}</div>
      ${g.items.map((it) => `
        <button class="nav-item ${it.id === page ? "on" : ""}" data-go="${it.id}" type="button">
          ${it.icon}<span>${it.name}</span>
        </button>`).join("")}
    `).join("");
    $$("#nav .nav-item").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  }

    function go(id) {
    page = id;
    $$(".view").forEach((v) => v.classList.remove("on"));
    const view = $("#view-" + id);
    if (view) view.classList.add("on");
    const t = TITLES[id] || ["", ""];
    $("#pageTitle").textContent = t[0];
    $("#pageSub").textContent = t[1];
    renderNav();
    const fn = renders[id];
    if (fn) fn();
    $(".main").scrollTop = 0;
    if (location.hash.replace("#", "") !== id) history.replaceState(null, "", "#" + id);
  }

  function openDrawer(html) {
    $("#drawer").innerHTML = html;
    $("#drawerMask").classList.add("on");
  }
  function closeDrawer() { $("#drawerMask").classList.remove("on"); }

  function renderDash() {
    const top = [...db.boxes].sort((a, b) => b.opens - a.opens).slice(0, 3);
    const orders = mergedOrders();
    const wait = mergedRefunds().filter((r) => r.st === "wait").length;
    const reviewPosts = communityPosts().filter((post) => post.status === "review").length;
    const incompleteRoutes = db.routes.filter((route) => routeCompleteness(route) < 100).length;
    const revenue = orders.filter((order) => order.st === "paid" || order.st === "opened").reduce((sum, order) => sum + Number(order.pay || 0), 0);
    const opened = orders.filter((order) => order.st === "opened").length;
    $("#view-dash").innerHTML = `
      <div class="page-head">
        <div><h2>运营总览</h2><p>围绕用户端“选盒 → 支付 → 开盒 → 行程 → 分享”的实时工作台</p></div>
        <button class="btn-ghost" type="button" data-go="stats">查看经营数据</button>
      </div>
      <div class="ops-kpis">
        <article class="ops-kpi"><span>在售盲盒</span><strong>${db.boxes.filter((box) => box.status === "on").length}</strong><small>共 ${db.boxes.length} 款</small></article>
        <article class="ops-kpi"><span>启用线路</span><strong>${db.routes.filter((route) => route.status === "on").length}</strong><small>${incompleteRoutes ? incompleteRoutes + " 条待补攻略" : "攻略均完整"}</small></article>
        <article class="ops-kpi"><span>开盒订单</span><strong>${opened}</strong><small>当前演示账本</small></article>
        <article class="ops-kpi"><span>有效成交</span><strong>￥${revenue}</strong><small>已支付且未退款</small></article>
        <article class="ops-kpi"><span>待退款</span><strong>${wait}</strong><small>需人工处理</small></article>
        <article class="ops-kpi"><span>社区待审</span><strong>${reviewPosts}</strong><small>来自用户端发布</small></article>
      </div>

      <div class="ops-board">
        <section class="ops-panel">
          <div class="ops-panel-head"><h3>今日待办</h3><span class="pill ${wait + reviewPosts + incompleteRoutes ? "wait" : "ok"}">${wait + reviewPosts + incompleteRoutes} 项</span></div>
          ${[
            ["退", "审核退款申请", wait + " 笔等待决定", "refunds"],
            ["审", "审核社区新内容", reviewPosts + " 篇来自用户端", "community"],
            ["路", "补全线路攻略", incompleteRoutes ? incompleteRoutes + " 条未达到 100%" : "六条线路均已完整", "routes"],
            ["单", "核对开盒与行程", opened + " 笔已生成线路快照", "orders"],
          ].map(([mark, title, text, target]) => `<div class="task-row"><div class="task-mark">${mark}</div><div><b>${title}</b><p>${text}</p></div><button type="button" data-go="${target}">处理</button></div>`).join("")}
        </section>
        <section class="ops-panel">
          <div class="ops-panel-head"><h3>盲盒保底覆盖</h3><button class="view-more" type="button" data-go="boxes">管理货架</button></div>
          <div class="metric-list">
            ${db.boxes.map((box) => {
              const coverage = boxCoverage(box);
              const width = coverage.total ? Math.round(coverage.eligible / coverage.total * 100) : 0;
              return `<div><div class="metric-row-head"><span>${box.name}</span><b>${coverage.eligible}/${coverage.total} 条</b></div><div class="meter"><i style="width:${width}%"></i></div></div>`;
            }).join("")}
          </div>
        </section>
      </div>

      <div class="section-header" style="margin-top:20px;">
        <div class="section-title">热门商品与线路承接</div>
        <button class="view-more" type="button" data-go="boxes">查看全部</button>
      </div>
      <div class="sheet"><table>
        <thead><tr><th>盲盒</th><th>售价 / 保底</th><th>可抽线路</th><th>累计开盒</th><th>状态</th><th></th></tr></thead>
        <tbody>${top.map((box) => {
          const coverage = boxCoverage(box);
          return `<tr><td><div class="who"><img class="thumb" src="${box.img}" alt=""><div><strong>${box.name}</strong><div style="font-size:11px;color:var(--muted);">${box.desc}</div></div></div></td><td>￥${box.price} / ≥ ￥${box.guarantee}</td><td><span class="pill ${coverage.ok ? "ok" : "bad"}">${coverage.eligible} 条符合</span></td><td>${box.opens}</td><td><span class="pill ${box.status === "on" ? "ok" : "wait"}">${box.status === "on" ? "上架" : "下架"}</span></td><td><button class="linkish" data-edit-box="${box.id}" type="button">详情</button></td></tr>`;
        }).join("")}</tbody>
      </table></div>
    `;
    bindGo("#view-dash");
    $$("#view-dash [data-edit-box]").forEach((b) => b.addEventListener("click", () => editBox(b.dataset.editBox)));
  }

  function bindGo(scope) {
    $$(scope + " [data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
  }

  function boxCard(b) {
    const coverage = boxCoverage(b);
    return `
      <article class="product-card">
        <div class="prod-img-wrap">
          <img src="${b.img}" alt="" />
          <div class="top-badge">${b.rank}</div>
        </div>
        <div class="prod-info">
          <div class="prod-name">${b.name}</div>
          <div class="prod-desc">${b.desc} · ${b.moods.map((m) => MOOD[m]).join(" / ")}</div>
          <div class="prod-bottom">
            <div class="prod-price"><span>￥</span>${b.price} <span style="color:var(--muted);font-size:11px;font-weight:600;">保底 ${b.guarantee}</span></div>
            <button class="linkish" type="button" data-edit-box="${b.id}">编辑</button>
          </div>
          <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
            <span class="pill ${b.status === "on" ? "ok" : "wait"}">${b.status === "on" ? "上架" : "下架"}</span>
            <span class="pill ${coverage.ok ? "" : "bad"}">${coverage.eligible}/${coverage.total} 条线路符合保底</span>
          </div>
        </div>
      </article>`;
  }

  function renderBoxes() {
    const list = db.boxes.filter((b) => {
      const cat = db.filters.boxCat === "all" || b.category === db.filters.boxCat;
      const st = db.filters.boxSt === "all" || b.status === db.filters.boxSt;
      return cat && st;
    });
    $("#view-boxes").innerHTML = `
      <div class="page-head">
        <div>
          <h2>货架上的盒子</h2>
          <p>售价与保底写在卡片上，像橱窗价签</p>
        </div>
        <button class="btn-sage" type="button" id="newBox">新建盲盒</button>
      </div>
      <div class="toolbar">
        ${["all", "nearby", "province", "cross", "theme"].map((c) => `<button class="chip ${db.filters.boxCat === c ? "on" : ""}" data-box-cat="${c}" type="button">${c === "all" ? "全部" : CAT[c]}</button>`).join("")}
        <span style="width:8px"></span>
        ${[["all", "全部状态"], ["on", "上架"], ["off", "下架"]].map(([v, n]) => `<button class="chip ${db.filters.boxSt === v ? "on" : ""}" data-box-st="${v}" type="button">${n}</button>`).join("")}
      </div>
      <div class="product-grid">${list.map(boxCard).join("") || '<div class="empty" style="grid-column:1/-1">没有匹配的盒子</div>'}</div>
    `;
    $$("#view-boxes [data-box-cat]").forEach((b) => b.addEventListener("click", () => { db.filters.boxCat = b.dataset.boxCat; renderBoxes(); }));
    $$("#view-boxes [data-box-st]").forEach((b) => b.addEventListener("click", () => { db.filters.boxSt = b.dataset.boxSt; renderBoxes(); }));
    $$("#view-boxes [data-edit-box]").forEach((b) => b.addEventListener("click", () => editBox(b.dataset.editBox)));
    $("#newBox").addEventListener("click", () => editBox(null));
  }

  function editBox(id) {
    const b = db.boxes.find((x) => x.id === id) || {
      id: "box_" + Date.now(), name: "", category: "nearby", tag: "周边游", desc: "", price: 99, guarantee: 120,
      moods: ["happy"], img: db.boxes[0].img, status: "on", sort: 10, rank: "NEW", opens: 0,
    };
    const isNew = !db.boxes.find((x) => x.id === (id || b.id));
    openDrawer(`
      <h3>${id ? "编辑盲盒" : "新出炉的盒子"}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:16px;">与用户端商品卡片、详情页和开盒前攻略同步</p>
      <div class="preview-split">
      <div><div class="form-grid">
        <div class="field span2"><label>名称</label><input id="fName" value="${esc(b.name)}" /></div>
        <div class="field"><label>分类</label>
          <select id="fCat">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${b.category === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        </div>
        <div class="field"><label>展示标签</label><input id="fTag" value="${esc(b.tag)}" /></div>
        <div class="field"><label>售价</label><input id="fPrice" type="number" value="${b.price}" /></div>
        <div class="field"><label>保底价值</label><input id="fGua" type="number" value="${b.guarantee}" /></div>
        <div class="field span2"><label>简介</label><input id="fDesc" value="${esc(b.desc)}" /></div>
        <div class="field span2"><label>适配心情</label>
          <div class="moods" id="fMoods">
            ${Object.entries(MOOD).map(([k, v]) => `<label class="check"><input type="checkbox" value="${k}" ${b.moods.includes(k) ? "checked" : ""}/> ${v}</label>`).join("")}
          </div>
        </div>
        <div class="field"><label>状态</label>
          <select id="fSt"><option value="on" ${b.status === "on" ? "selected" : ""}>上架</option><option value="off" ${b.status === "off" ? "selected" : ""}>下架</option></select>
        </div>
        <div class="field"><label>排序</label><input id="fSort" type="number" value="${b.sort}" /></div>
      </div></div>
      <aside>
        <div class="eyebrow">用户端预览</div>
        <article class="mobile-preview">
          <img src="${b.img}" alt="" />
          <div class="mobile-preview-body"><h4 id="boxPreviewName">${esc(b.name || "未命名盲盒")}</h4><p id="boxPreviewDesc">${esc(b.desc || "填写商品简介")}</p><div class="mobile-preview-price"><strong id="boxPreviewPrice">￥${b.price}</strong><span id="boxPreviewGuarantee">保底 ≥ ￥${b.guarantee}</span></div></div>
        </article>
        <div id="boxCoverageNote" style="margin-top:10px;"></div>
        <p style="margin-top:10px;color:var(--muted);font-size:10px;line-height:1.6;">开盒前攻略只显示分类级准备信息，具体景点在开盒后解锁。</p>
      </aside></div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" id="saveBox" style="flex:1">放入货架</button>
        <button class="btn-ghost" type="button" id="closeBox">取消</button>
      </div>
    `);
    const refreshBoxPreview = () => {
      const name = $("#fName").value.trim() || "未命名盲盒";
      const desc = $("#fDesc").value.trim() || "填写商品简介";
      const price = Number($("#fPrice").value || 0);
      const guarantee = Number($("#fGua").value || 0);
      const category = $("#fCat").value;
      const candidates = db.routes.filter((route) => route.category === category && route.status === "on");
      const eligible = candidates.filter((route) => route.value >= guarantee);
      $("#boxPreviewName").textContent = name;
      $("#boxPreviewDesc").textContent = desc;
      $("#boxPreviewPrice").textContent = "￥" + price;
      $("#boxPreviewGuarantee").textContent = "保底 ≥ ￥" + guarantee;
      $("#boxCoverageNote").className = eligible.length ? "ok-note" : "risk-note";
      $("#boxCoverageNote").textContent = eligible.length
        ? eligible.length + " / " + candidates.length + " 条启用线路符合当前保底"
        : "当前分类没有线路满足保底，用户开盒会失败";
    };
    ["#fName", "#fDesc", "#fPrice", "#fGua"].forEach((selector) => $(selector).addEventListener("input", refreshBoxPreview));
    $("#fCat").addEventListener("change", refreshBoxPreview);
    refreshBoxPreview();
    $("#closeBox").addEventListener("click", closeDrawer);
    $("#saveBox").addEventListener("click", () => {
      const next = {
        ...b,
        name: $("#fName").value.trim() || "未命名盲盒",
        category: $("#fCat").value,
        tag: $("#fTag").value,
        desc: $("#fDesc").value,
        price: +$("#fPrice").value,
        guarantee: +$("#fGua").value,
        moods: $$("#fMoods input:checked").map((i) => i.value),
        status: $("#fSt").value,
        sort: +$("#fSort").value,
      };
      if (next.guarantee < next.price) return toast("保底价值须高于售价，开盒才会过校验");
      const eligibleRoutes = db.routes.filter((route) => route.category === next.category && route.status === "on" && route.value >= next.guarantee);
      if (next.status === "on" && !eligibleRoutes.length) return toast("当前分类没有线路满足保底，请先调整保底或线路票面");
      const i = db.boxes.findIndex((x) => x.id === next.id);
      if (i >= 0) db.boxes[i] = next; else db.boxes.unshift(next);
      closeDrawer();
      toast(isNew && i < 0 ? "新盒子已上架草稿" : "货架已更新");
      renderBoxes();
    });
  }

  function renderRoutes() {
    const complete = db.routes.filter((route) => routeCompleteness(route) === 100).length;
    $("#view-routes").innerHTML = `
      <div class="page-head">
        <div><h2>线路与攻略</h2><p>线路池决定开盒结果，攻略内容决定用户“我的行程”里看到什么</p></div>
        <button class="btn-sage" type="button" id="newRoute">新建线路</button>
      </div>
      <div class="toolbar"><span class="pill ok">${db.routes.filter((route) => route.status === "on").length} 条启用</span><span class="pill">${complete} / ${db.routes.length} 攻略完整</span><span class="pill">${db.routes.reduce((sum, route) => sum + ((guideForRoute(route) || {}).attractions || []).length, 0)} 个景点节点</span></div>
      <div class="sheet"><table>
        <thead><tr><th>线路</th><th>分类 / 票面</th><th>攻略完整度</th><th>景点 / 日程</th><th>可承接盲盒</th><th>状态</th><th></th></tr></thead>
        <tbody>
          ${db.routes.map((r) => {
            const guide = guideForRoute(r);
            const completeness = routeCompleteness(r);
            const related = boxesForRoute(r);
            return `
            <tr>
              <td><div class="who"><img class="thumb" src="${r.img}" alt="" /><div><strong>${r.name}</strong><div style="font-size:11px;color:var(--muted);">${r.moodText}</div></div></div></td>
              <td>${CAT[r.category]} · ￥${r.value}<div style="font-size:10px;color:var(--muted);margin-top:3px;">${r.dest}</div></td>
              <td><div class="coverage"><div><span>攻略</span><b>${completeness}%</b></div><div class="meter"><i style="width:${completeness}%"></i></div></div></td>
              <td>${guide ? guide.attractions.length + " 个 / " + guide.schedule.length + " 站" : "未配置"}</td>
              <td>${related.length ? related.map((box) => `<span class="pill" style="margin:2px;">${box.name.replace("盲盒", "")}</span>`).join("") : '<span class="pill bad">无</span>'}</td>
              <td><span class="pill ${r.status === "on" ? "ok" : "wait"}">${r.status === "on" ? "启用" : "停用"}</span></td>
              <td><div class="action-set"><button class="linkish" data-route-guide="${r.id}" type="button">攻略</button><button class="linkish" data-edit-route="${r.id}" type="button">基础信息</button></div></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table></div>
    `;
    $("#newRoute").addEventListener("click", () => editRoute(null));
    $$("#view-routes [data-edit-route]").forEach((b) => b.addEventListener("click", () => editRoute(b.dataset.editRoute)));
    $$("#view-routes [data-route-guide]").forEach((b) => b.addEventListener("click", () => showRouteGuide(b.dataset.routeGuide)));
  }

  function showRouteGuide(id) {
    const route = db.routes.find((item) => item.id === id);
    const guide = guideForRoute(route);
    if (!route || !guide) return toast("这条线路还没有攻略内容");
    openDrawer(`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;"><div><h3>${esc(route.name)}</h3><p style="color:var(--muted);font-size:11px;margin-top:4px;">${esc(route.dest)} · ${CAT[route.category]} · 攻略完整度 ${routeCompleteness(route)}%</p></div><button class="btn-sage" id="editRouteGuide" type="button">编辑攻略</button></div>
      <div class="route-hero"><img src="${route.img}" alt=""><div><div class="eyebrow">开盒后用户可见</div><p>${esc(guide.summary)}</p><div class="ok-note" style="margin-top:8px;">天气提醒：${esc(guide.weather)}</div></div></div>
      <div class="route-facts">${guide.facts.map(([key, value]) => `<div class="route-fact"><span>${esc(key)}</span><b>${esc(value)}</b></div>`).join("")}</div>
      <section class="detail-section"><div class="detail-section-head"><h4>详细分时路线</h4><span>${guide.schedule.length} 个节点</span></div><div class="timeline-list">${guide.schedule.map((stop) => `<article class="timeline-stop"><time>${esc(stop[0])}</time><b>${esc(stop[1])}</b><p>${esc(stop[2])} · ${esc(stop[3])}</p></article>`).join("")}</div></section>
      <section class="detail-section"><div class="detail-section-head"><h4>沿途景点详解</h4><span>${guide.attractions.length} 个景点</span></div>${guide.attractions.map((item) => `<article class="attraction-admin"><div class="attraction-admin-head"><b>${esc(item[0])}</b><span>${esc(item[1])}</span></div><p>${esc(item[2])}</p><div class="attraction-meta"><div><strong>核心看点</strong>${esc(item[3])}</div><div><strong>游览提醒</strong>${esc(item[4])}</div></div></article>`).join("")}</section>
      <section class="detail-section"><div class="detail-section-head"><h4>餐食与休息</h4></div>${guide.living.map(([key, value]) => `<div class="kv"><span>${esc(key)}</span><strong style="max-width:70%;text-align:right;">${esc(value)}</strong></div>`).join("")}</section>
      <section class="detail-section"><div class="detail-section-head"><h4>天气备选</h4></div>${guide.planB.map(([key, value]) => `<div class="kv"><span>${esc(key)}</span><strong style="max-width:70%;text-align:right;">${esc(value)}</strong></div>`).join("")}</section>
      <section class="detail-section"><div class="detail-section-head"><h4>安全提醒</h4></div>${guide.tips.map((tip, index) => `<div class="task-row"><div class="task-mark">${index + 1}</div><div><p style="color:var(--ink);">${esc(tip)}</p></div></div>`).join("")}</section>
      <button class="btn-ghost btn-block" id="closeRouteGuide" type="button" style="margin-top:18px;">关闭</button>
    `);
    $("#editRouteGuide").addEventListener("click", () => editRouteGuide(id));
    $("#closeRouteGuide").addEventListener("click", closeDrawer);
  }

  function editRouteGuide(id) {
    const route = db.routes.find((item) => item.id === id);
    const guide = guideForRoute(route);
    if (!route || !guide) return;
    const attractionEditor = (item, index) => `<div class="guide-edit-block" data-attraction-edit><div class="guide-edit-head"><b>景点 ${index + 1}</b><button type="button" data-remove-attraction>删除</button></div><div class="form-grid"><div class="field"><label>名称</label><input data-a-name value="${esc(item[0])}"></div><div class="field"><label>停留时间</label><input data-a-stay value="${esc(item[1])}"></div><div class="field span2"><label>景点介绍</label><textarea data-a-desc>${esc(item[2])}</textarea></div><div class="field"><label>核心看点</label><textarea data-a-highlight>${esc(item[3])}</textarea></div><div class="field"><label>游览提醒</label><textarea data-a-tip>${esc(item[4])}</textarea></div></div></div>`;
    openDrawer(`
      <h3>编辑线路攻略</h3><p style="font-size:12px;color:var(--muted);margin:4px 0 14px;">${esc(route.name)} · 保存后用于行程详情和客服查询</p>
      <div class="field"><label>路线摘要</label><textarea id="guideSummary">${esc(guide.summary)}</textarea></div>
      <div class="field"><label>天气提醒</label><textarea id="guideWeather">${esc(guide.weather)}</textarea></div>
      <div class="detail-section-head"><h4>沿途景点</h4><button class="btn-ghost" id="addAttraction" type="button">新增景点</button></div>
      <div id="attractionEditor">${guide.attractions.map(attractionEditor).join("")}</div>
      <div style="display:flex;gap:8px;margin-top:18px;"><button class="btn-sage" id="saveRouteGuide" type="button" style="flex:1">保存攻略</button><button class="btn-ghost" id="cancelRouteGuide" type="button">取消</button></div>
    `);
    const bindRemove = () => $$("#attractionEditor [data-remove-attraction]").forEach((button) => {
      button.onclick = () => button.closest("[data-attraction-edit]").remove();
    });
    bindRemove();
    $("#addAttraction").addEventListener("click", () => {
      $("#attractionEditor").insertAdjacentHTML("beforeend", attractionEditor(["新景点", "30 分钟", "填写景点介绍", "填写核心看点", "填写游览提醒"], $$("#attractionEditor [data-attraction-edit]").length));
      bindRemove();
      $("#drawer").scrollTop = $("#drawer").scrollHeight;
    });
    $("#cancelRouteGuide").addEventListener("click", () => showRouteGuide(id));
    $("#saveRouteGuide").addEventListener("click", () => {
      const attractions = $$("#attractionEditor [data-attraction-edit]").map((block) => [
        $("[data-a-name]", block).value.trim(), $("[data-a-stay]", block).value.trim(), $("[data-a-desc]", block).value.trim(), $("[data-a-highlight]", block).value.trim(), $("[data-a-tip]", block).value.trim(),
      ]).filter((item) => item[0]);
      if (!attractions.length) return toast("至少保留一个景点");
      ROUTE_GUIDES[id] = { ...guide, summary: $("#guideSummary").value.trim(), weather: $("#guideWeather").value.trim(), attractions };
      adminState.routeGuides[id] = ROUTE_GUIDES[id];
      saveAdminState();
      toast("线路攻略已保存");
      showRouteGuide(id);
      renderRoutes();
    });
  }

  function editRoute(id) {
    const r = db.routes.find((x) => x.id === id) || {
      id: "r" + Date.now(), name: "", dest: "", category: "nearby", value: 148, badge: "古村",
      moodText: "", highlights: "", includes: "", status: "on", img: db.routes[0].img, draws: 0,
    };
    openDrawer(`
      <h3>${id ? "编辑线路" : "新线路"}</h3>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field span2"><label>名称</label><input id="rName" value="${r.name}" /></div>
        <div class="field"><label>目的地</label><input id="rDest" value="${r.dest}" /></div>
        <div class="field"><label>分类</label><select id="rCat">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${r.category === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="field"><label>票面价值</label><input id="rVal" type="number" value="${r.value}" /></div>
        <div class="field"><label>徽章</label>
          <select id="rBadge">${db.badges.map((b) => `<option ${r.badge === b.name ? "selected" : ""}>${b.name}</option>`).join("")}</select>
        </div>
        <div class="field span2"><label>亮点</label><input id="rHi" value="${r.highlights}" /></div>
        <div class="field span2"><label>包含</label><input id="rIn" value="${r.includes}" /></div>
        <div class="field span2"><label>情绪文案</label><input id="rMood" value="${r.moodText}" /></div>
        <div class="field"><label>状态</label><select id="rStatus"><option value="on" ${r.status === "on" ? "selected" : ""}>启用</option><option value="off" ${r.status === "off" ? "selected" : ""}>停用</option></select></div>
        <div class="field"><label>攻略状态</label><div class="${guideForRoute(r) ? "ok-note" : "risk-note"}">${guideForRoute(r) ? routeCompleteness(r) + "% · " + guideForRoute(r).attractions.length + " 个景点" : "保存基础信息后再配置攻略"}</div></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" id="saveRoute" type="button" style="flex:1">保存</button>
        <button class="btn-ghost" id="closeR" type="button">取消</button>
      </div>
    `);
    $("#closeR").addEventListener("click", closeDrawer);
    $("#saveRoute").addEventListener("click", () => {
      const next = {
        ...r,
        name: $("#rName").value.trim() || "未命名线路",
        dest: $("#rDest").value,
        category: $("#rCat").value,
        value: +$("#rVal").value,
        badge: $("#rBadge").value,
        highlights: $("#rHi").value,
        includes: $("#rIn").value,
        moodText: $("#rMood").value,
        status: $("#rStatus").value,
      };
      const i = db.routes.findIndex((x) => x.id === next.id);
      if (i >= 0) db.routes[i] = next; else db.routes.unshift(next);
      if (!ROUTE_GUIDES[next.id]) {
        ROUTE_GUIDES[next.id] = { summary: "", weather: "", schedule: [], facts: [], attractions: [], living: [], planB: [], tips: [] };
        adminState.routeGuides[next.id] = ROUTE_GUIDES[next.id];
        saveAdminState();
      }
      closeDrawer(); toast("线路池已更新"); renderRoutes();
    });
  }

  function renderBadges() {
    $("#view-badges").innerHTML = `
      <div class="page-head"><div><h2>十二枚印章</h2><p>解锁人数来自开盒关联线路</p></div></div>
      <div class="badge-grid">
        ${db.badges.map((b) => `
          <article class="badge-card ${b.unlock ? "" : ""}" style="${b.unlock ? "" : "opacity:.55"}">
            <div class="stamp">${b.mark}</div>
            <div style="font-weight:800;font-size:13px;">${b.name}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;">${b.unlock} 人解锁</div>
            <div style="font-size:11px;color:var(--sage-deep);margin-top:2px;">${b.routes} 条线路</div>
          </article>`).join("")}
      </div>
    `;
  }

  function renderBanners() {
    $("#view-banners").innerHTML = `
      <div class="page-head"><div><h2>首页横幅</h2><p>鼠尾草渐变条，右边仍是风景照片</p></div>
        <button class="btn-sage" type="button" id="newBn">新建运营位</button></div>
      <div class="sheet">
        ${db.banners.map((b) => `
          <div class="banner-card" style="border-bottom:1px solid var(--line);align-items:center;">
            <img src="${b.img}" alt="" />
            <div>
              <div class="kicker" style="font-size:10px;letter-spacing:.14em;color:var(--sage-deep);font-weight:700;">${b.tag}</div>
              <strong>${b.title}</strong>
              <p style="font-size:12px;color:var(--muted);margin-top:4px;">${b.sub}</p>
              <p style="font-size:11px;margin-top:4px;">跳转 ${b.to}</p>
            </div>
            <button class="switch ${b.on ? "on" : ""}" type="button" data-bn="${b.id}"><i></i></button>
          </div>`).join("")}
      </div>
    `;
    $$("#view-banners .switch").forEach((sw) => sw.addEventListener("click", () => {
      const item = db.banners.find((x) => x.id === sw.dataset.bn);
      item.on = !item.on; renderBanners(); toast(item.on ? "横幅已点亮" : "横幅已收起");
    }));
    $("#newBn").addEventListener("click", () => {
      db.banners.push({ id: "bn" + Date.now(), title: "新活动横幅", sub: "补一句卖点", tag: "运营", to: "无跳转", on: false, img: db.boxes[0].img });
      renderBanners(); toast("已加一条草稿横幅");
    });
  }

  function renderAi() {
    const a = db.ai;
    $("#view-ai").innerHTML = `
      <div class="page-head"><div><h2>小途的配方</h2><p>人设写在牛皮纸上，模型失败就走关键词降级</p></div>
        <button class="btn-sage" type="button" id="saveAi">保存配方</button></div>
      <div class="two-col">
        <div class="paper">
          <div class="field"><label>开场白</label><textarea id="aiGreet">${a.greet}</textarea></div>
          <div class="field"><label>系统 Prompt</label><textarea id="aiPrompt" style="min-height:140px">${a.prompt}</textarea></div>
          <div class="field"><label>日记模板</label><textarea id="aiDiary">${a.diary}</textarea></div>
        </div>
        <div>
          <div class="paper" style="margin-bottom:12px;">
            <div class="section-title" style="font-size:15px;margin-bottom:8px;">快捷问题</div>
            ${a.quick.map((q, i) => `<div class="todo-row"><span>${q}</span><button class="linkish" data-del-q="${i}" type="button">去掉</button></div>`).join("")}
          </div>
          <div class="paper">
            <div class="section-title" style="font-size:15px;margin-bottom:8px;">降级话术</div>
            ${a.fallback.map((q) => `<div class="todo-row"><span>${q}</span></div>`).join("")}
          </div>
        </div>
      </div>
    `;
    $("#saveAi").addEventListener("click", () => {
      db.ai.greet = $("#aiGreet").value;
      db.ai.prompt = $("#aiPrompt").value;
      db.ai.diary = $("#aiDiary").value;
      toast("小途记住了");
    });
    $$("#view-ai [data-del-q]").forEach((b) => b.addEventListener("click", () => {
      db.ai.quick.splice(+b.dataset.delQ, 1); renderAi();
    }));
  }

  function renderQuiz() {
    $("#view-quiz").innerHTML = `
      <div class="page-head"><div><h2>旅行 DNA</h2><p>选项按 nature / city / adventure / culture 计分</p></div></div>
      <div class="two-col">
        <div class="sheet"><table>
          <thead><tr><th>#</th><th>题干</th><th>选项</th></tr></thead>
          <tbody>${db.quiz.map((q) => `<tr><td>${q.n}</td><td>${q.q}</td><td style="font-size:12px;color:var(--muted);">${q.a.join(" · ")}</td></tr>`).join("")}</tbody>
        </table></div>
        <div class="product-grid">
          ${db.persons.map((p, i) => `
            <article class="product-card">
              <div class="prod-info">
                <div class="eyebrow">${p.type.toUpperCase()}</div>
                <div class="prod-name">${p.name}</div>
                <div class="prod-desc">${p.rec}</div>
              </div>
            </article>`).join("")}
        </div>
      </div>
    `;
  }

  function orderRows(list) {
    return list.map((o) => {
      const [lab, cls] = ORDER_ST[o.st];
      return `<tr>
        <td>${o.no}</td>
        <td>${guestCell(o)}</td>
        <td>${o.box}</td>
        <td>￥${o.pay}</td>
        <td>${o.ch}</td>
        <td><span class="pill ${cls}">${lab}</span></td>
        <td>${o.route}</td>
        <td>${o.time}</td>
        <td><button class="linkish" data-order="${o.no}" type="button">详情</button></td>
      </tr>`;
    }).join("");
  }

  function renderCommunity() {
    const all = communityPosts();
    const list = all.filter((post) => adminState.communityFilter === "all" || post.status === adminState.communityFilter);
    const counts = all.reduce((result, post) => ({ ...result, [post.status]: (result[post.status] || 0) + 1 }), {});
    $("#view-community").innerHTML = `
      <div class="page-head"><div><h2>社区内容审核</h2><p>用户端新发布内容会进入待审核，运营可通过、精选或下架</p></div><span class="pill ${counts.review ? "wait" : "ok"}">${counts.review || 0} 篇待审</span></div>
      <div class="toolbar">${[["all", "全部 " + all.length], ["review", "待审核 " + (counts.review || 0)], ["published", "已发布 " + (counts.published || 0)], ["featured", "精选 " + (counts.featured || 0)], ["down", "已下架 " + (counts.down || 0)]].map(([value, label]) => `<button class="chip ${adminState.communityFilter === value ? "on" : ""}" data-community-filter="${value}" type="button">${label}</button>`).join("")}</div>
      <div class="sheet"><table><thead><tr><th>帖子</th><th>作者 / 来源</th><th>话题 / 关联盲盒</th><th>互动</th><th>发布时间</th><th>状态</th><th></th></tr></thead><tbody>${list.map((post) => {
        const box = db.boxes.find((item) => item.id === post.boxId);
        const [label, cls] = moderationLabel(post.status);
        const cover = (post.imgs && post.imgs[0]) || post.img || db.boxes[0].img;
        return `<tr><td><div class="who"><img class="community-cover" src="${cover}" alt=""><div><strong>${esc(post.title)}</strong><div style="font-size:10px;color:var(--muted);margin-top:3px;">${esc(post.place || "未标记地点")}</div></div></div></td><td>${esc(post.author || "途友")}<div style="font-size:10px;color:var(--sage-deep);">${post.source}</div></td><td>${esc(post.topic || "#旅途分享")}<div style="font-size:10px;color:var(--muted);margin-top:3px;">${box ? esc(box.name) : "未关联盲盒"}</div></td><td>${post.likes || 0} 赞<br><span style="font-size:10px;color:var(--muted);">${post.comments || 0} 评 · ${post.collects || 0} 藏</span></td><td>${esc(post.time || "—")}</td><td><span class="pill ${cls}">${label}</span></td><td><button class="linkish" type="button" data-community-post="${post.id}">审核</button></td></tr>`;
      }).join("") || '<tr><td colspan="7"><div class="empty">当前筛选下没有内容</div></td></tr>'}</tbody></table></div>`;
    $$("#view-community [data-community-filter]").forEach((button) => button.addEventListener("click", () => {
      adminState.communityFilter = button.dataset.communityFilter;
      saveAdminState();
      renderCommunity();
    }));
    $$("#view-community [data-community-post]").forEach((button) => button.addEventListener("click", () => showCommunityPost(button.dataset.communityPost)));
  }

  function showCommunityPost(id) {
    const post = communityPosts().find((item) => item.id === id);
    if (!post) return;
    const box = db.boxes.find((item) => item.id === post.boxId);
    const [label, cls] = moderationLabel(post.status);
    const cover = (post.imgs && post.imgs[0]) || post.img || db.boxes[0].img;
    const userComments = ((readUserStore().comments || {})[id] || []);
    openDrawer(`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;"><div><h3>${esc(post.title)}</h3><p style="font-size:11px;color:var(--muted);margin-top:4px;">${esc(post.author || "途友")} · ${esc(post.place || "未标记地点")} · ${esc(post.time || "—")}</p></div><span class="pill ${cls}">${label}</span></div>
      <img class="post-preview-cover" src="${cover}" alt="${esc(post.title)}">
      <div class="toolbar"><span class="pill">${esc(post.topic || "#旅途分享")}</span><span class="pill">${post.likes || 0} 赞</span><span class="pill">${post.comments || 0} 评论</span><span class="pill">${post.collects || 0} 收藏</span></div>
      <p class="post-body">${esc(post.text || "暂无正文")}</p>
      ${box ? `<div class="link-card"><img class="thumb" src="${box.img}" alt=""><div class="copy"><b>${esc(box.name)}</b><p>售价 ￥${box.price} · 保底 ≥ ￥${box.guarantee}</p></div><button type="button" id="viewPostBox">查看商品</button></div>` : '<div class="risk-note" style="margin-top:12px;">这篇帖子没有关联盲盒</div>'}
      <section class="detail-section"><div class="detail-section-head"><h4>最新评论</h4><span>${userComments.length ? userComments.length + " 条用户评论" : "暂无用户端评论明细"}</span></div>${userComments.map((comment) => `<div class="kv"><span>${esc(comment.by || "途友")}</span><strong>${esc(comment.text)}</strong></div>`).join("") || '<div class="empty" style="padding:16px;">互动数据已同步，评论正文暂无</div>'}</section>
      <div class="post-actions"><button class="primary" type="button" data-moderate="published">审核通过</button><button type="button" data-moderate="featured">设为精选</button><button class="danger" type="button" data-moderate="down">下架内容</button></div>
      <button class="btn-ghost btn-block" style="margin-top:10px;" type="button" id="closeCommunity">关闭</button>
    `);
    if (box) $("#viewPostBox").addEventListener("click", () => editBox(box.id));
    $$("#drawer [data-moderate]").forEach((button) => button.addEventListener("click", () => {
      adminState.moderation[id] = button.dataset.moderate;
      saveAdminState();
      toast(button.dataset.moderate === "down" ? "内容已下架" : (button.dataset.moderate === "featured" ? "已设为精选" : "审核已通过"));
      renderCommunity();
      showCommunityPost(id);
    }));
    $("#closeCommunity").addEventListener("click", closeDrawer);
  }

  function renderComments() {
    const s = readUserStore();
    const posts = communityPosts();
    const live = Object.entries(s.comments || {}).flatMap(([postId, comments]) => (comments || []).map((comment, index) => ({ id: postId + "_" + index, text: comment.text, post: (posts.find((post) => post.id === postId) || {}).title || "用户帖子", user: comment.by, report: "无", live: true })));
    const list = [...live, { id:"c1", text:"这条路线看起来好舒服", post:"青石板上的慢生活", user:"阿茶", report:"无" }, { id:"c2", text:"求抽同款！点击主页", post:"湖边搭好帐篷", user:"米粒", report:"疑似广告" }, { id:"c3", text:"太治愈了", post:"一个人的周末", user:"清清", report:"无" }];
    $("#view-comments").innerHTML = `<div class="page-head"><div><h2>评论审核</h2><p>用户端评论与举报内容分开处置</p></div><span class="pill">${live.length} 条来自用户端</span></div><div class="sheet"><table><thead><tr><th>评论</th><th>帖子</th><th>用户</th><th>来源</th><th>举报原因</th><th>状态</th><th></th></tr></thead><tbody>${list.map((item) => `<tr><td>${esc(item.text)}</td><td>${esc(item.post)}</td><td>${esc(item.user)}</td><td>${item.live ? "用户端" : "演示"}</td><td>${item.report}</td><td><span class="pill ${item.report !== "无" ? "wait" : "ok"}">${item.report !== "无" ? "待处理" : "正常"}</span></td><td><button class="linkish" type="button" data-comment="${item.id}">${item.report !== "无" ? "隐藏" : "标记"}</button></td></tr>`).join("")}</tbody></table></div>`;
    $$("#view-comments [data-comment]").forEach((b) => b.addEventListener("click", () => { toast("评论处理状态已更新"); b.textContent = "已处理"; }));
  }
  function renderCheckins() {
    $("#view-checkins").innerHTML = `<div class="page-head"><div><h2>打卡记录</h2><p>地点、照片与成就进度</p></div></div><div class="product-grid">${[["渼陂古村", "小鹿", "2026-09-17", "古村"],["仙女湖畔", "北北", "2026-09-16", "露营"],["西关深巷", "米粒", "2026-09-15", "美食"]].map((r) => `<article class="product-card"><div class="prod-info"><div class="eyebrow">${r[2]} · ${r[1]}</div><div class="prod-name">${r[0]}</div><div class="prod-desc">解锁成就「${r[3]}」 · 已生成分享海报</div><span class="pill ok">有效打卡</span></div></article>`).join("")}</div>`;
  }
  function renderOrders() {
    const list = mergedOrders().filter((o) => db.filters.orderSt === "all" || o.st === db.filters.orderSt);
    $("#view-orders").innerHTML = `
      <div class="page-head"><div><h2>订单小票</h2><p>支付宝沙箱 · 本期无微信</p></div>
        <button class="btn-ghost" type="button" id="exportOrders">导出明细</button></div>
      <div class="toolbar">
        ${[["all", "全部"], ["pending_pay", "待支付"], ["paid", "已支付"], ["opened", "已开盒"], ["cancelled", "已取消"], ["refunded", "已退款"]]
          .map(([v, n]) => `<button class="chip ${db.filters.orderSt === v ? "on" : ""}" data-ost="${v}" type="button">${n}</button>`).join("")}
      </div>
      <div class="sheet"><table>
        <thead><tr><th>单号</th><th>用户</th><th>盲盒</th><th>实付</th><th>渠道</th><th>状态</th><th>开盒结果</th><th>时间</th><th></th></tr></thead>
        <tbody>${orderRows(list)}</tbody>
      </table></div>
    `;
    $$("#view-orders [data-ost]").forEach((b) => b.addEventListener("click", () => { db.filters.orderSt = b.dataset.ost; renderOrders(); }));
    $$("#view-orders [data-order]").forEach((b) => b.addEventListener("click", () => showOrder(b.dataset.order)));
    $("#exportOrders").addEventListener("click", () => toast("原型不落文件，正式环境按时间范围导出"));
  }

  function showOrder(no) {
    const o = mergedOrders().find((x) => x.no === no);
    if (!o) return;
    const [lab] = ORDER_ST[o.st];
    const trip = mergedTrips().find((item) => item.orderId === o.no || (o.tripId && item.id === o.tripId) || (o.st === "opened" && item.route === o.route));
    const route = db.routes.find((item) => item.id === (trip && trip.routeId) || item.name === o.route || (trip && item.name === trip.route));
    openDrawer(`
      <h3>订单详情</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">${o.no}</p>
      ${[
        ["用户", [o.user, wxNickOf(o) ? "微信名 " + wxNickOf(o) : "", o.phone].filter(Boolean).join(" · ")],
        ["盲盒快照", o.box],
        ["实付", "￥" + o.pay],
        ["渠道", o.ch],
        ["状态", lab],
        ["开盒结果", o.route],
        ["下单时间", o.time],
      ].map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`).join("")}
      ${route ? `<div class="link-card"><img class="thumb" src="${route.img}" alt=""><div class="copy"><b>${route.name}</b><p>${route.dest} · ${routeCompleteness(route)}% 攻略完整</p></div><button type="button" id="openOrderRoute">查看攻略</button></div>` : ""}
      ${trip ? `<div class="link-card"><div class="task-mark">行</div><div class="copy"><b>已生成用户行程</b><p>${trip.date} · ${trip.ok ? "有效" : "已退款"}</p></div><button type="button" id="openOrderTrip">行程详情</button></div>` : (o.st === "opened" ? '<div class="risk-note" style="margin-top:12px;">订单已开盒，但未匹配到行程快照</div>' : "")}
      <button class="btn-ghost btn-block" style="margin-top:18px;" type="button" id="closeO">收起</button>
    `);
    if (route) $("#openOrderRoute").addEventListener("click", () => showRouteGuide(route.id));
    if (trip) $("#openOrderTrip").addEventListener("click", () => showTripDetail(trip.id));
    $("#closeO").addEventListener("click", closeDrawer);
  }

  function renderRefunds() {
    const list = mergedRefunds();
    $("#view-refunds").innerHTML = `
      <div class="page-head"><div><h2>退款柜台</h2><p>用户端提交的申请会出现在最上方；自动退只读可查</p></div></div>
      <div class="sheet"><table>
        <thead><tr><th>退款单</th><th>原订单</th><th>用户</th><th>原因</th><th>金额</th><th>类型</th><th>动作</th></tr></thead>
        <tbody>
          ${list.map((r) => `
            <tr>
              <td>${r.no}</td><td>${r.order}</td><td>${guestCell(r)}</td>
              <td>${r.reason}</td><td>￥${r.amount}</td>
              <td><span class="pill ${r.type === "自动" ? "wait" : "ok"}">${r.type}</span></td>
              <td>${r.st === "wait" && r.type === "人工"
                ? `<button class="linkish" data-ok="${r.no}" type="button">通过</button>
                   <button class="linkish" data-no="${r.no}" type="button">驳回</button>`
                : `<span class="pill wait">${r.st === "done" ? "已退回" : (r.st === "reject" ? "已驳回" : r.st)}</span>`}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>
    `;
    $$("#view-refunds [data-ok]").forEach((b) => b.addEventListener("click", () => decideRefund(b.dataset.ok, "done")));
    $$("#view-refunds [data-no]").forEach((b) => b.addEventListener("click", () => decideRefund(b.dataset.no, "reject")));
  }
  function decideRefund(no, st) {
    const mock = db.refunds.find((x) => x.no === no);
    if (mock) mock.st = st;
    const l = liveLedger();
    const lr = l.refunds.find((x) => x.no === no);
    if (lr) {
      lr.st = st;
      const o = l.orders.find((x) => x.no === lr.order);
      if (o) {
        o.refundSt = st;
        if (st === "done") o.st = "refunded";
      }
      saveLiveLedger(l);
      if (st === "done") patchUserTrips(lr.order);
    }
    toast(st === "done" ? "已通过，原路退回支付宝" : "已驳回，用户端可见原因");
    renderRefunds();
  }

  function renderTrips() {
    const list = mergedTrips();
    $("#view-trips").innerHTML = `
      <div class="page-head"><div><h2>行程记录</h2><p>开盒后生成的路线快照，可联查具体时间轴与逐景点攻略</p></div><span class="pill">${list.filter((trip) => trip.live).length} 条来自用户端</span></div>
      <div class="sheet"><table><thead><tr><th>用户</th><th>线路 / 目的地</th><th>出行日期</th><th>购入 / 票面</th><th>攻略</th><th>状态</th><th></th></tr></thead><tbody>${list.map((trip) => {
        const route = db.routes.find((item) => item.id === trip.routeId || item.name === String(trip.route || "").replace("（已退款）", ""));
        return `<tr style="${trip.ok ? "" : "opacity:.58"}"><td>${esc(trip.user)}${trip.wxName ? `<div style="font-size:10px;color:var(--sage-deep);">微信 ${esc(trip.wxName)}</div>` : ""}${trip.live ? '<div style="font-size:10px;color:var(--muted);">用户端同步</div>' : ""}</td><td><strong>${esc(trip.route)}</strong><div style="font-size:10px;color:var(--muted);margin-top:3px;">${esc(trip.dest)}</div></td><td>${esc(trip.date)}</td><td>￥${trip.price} / ￥${trip.val}</td><td>${route ? `<span class="pill">${routeCompleteness(route)}% · ${guideForRoute(route).attractions.length} 景点</span>` : '<span class="pill bad">未匹配</span>'}</td><td><span class="pill ${trip.ok ? "ok" : "bad"}">${trip.ok ? "有效" : "已退款"}</span></td><td><button class="linkish" data-trip="${trip.id}" type="button">详情</button></td></tr>`;
      }).join("")}</tbody></table></div>
    `;
    $$("#view-trips [data-trip]").forEach((button) => button.addEventListener("click", () => showTripDetail(button.dataset.trip)));
  }

  function showTripDetail(id) {
    const trip = mergedTrips().find((item) => String(item.id) === String(id));
    if (!trip) return;
    const route = db.routes.find((item) => item.id === trip.routeId || item.name === String(trip.route || "").replace("（已退款）", ""));
    const guide = guideForRoute(route);
    openDrawer(`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;"><div><h3>${esc(trip.route)}</h3><p style="font-size:11px;color:var(--muted);margin-top:4px;">${esc(trip.user)} · ${esc(trip.date)} · ${esc(trip.dest)}</p></div><span class="pill ${trip.ok ? "ok" : "bad"}">${trip.ok ? "有效行程" : "已退款"}</span></div>
      <div class="route-facts" style="margin-top:14px;"><div class="route-fact"><span>购入价</span><b>￥${trip.price}</b></div><div class="route-fact"><span>票面价值</span><b>￥${trip.val}</b></div><div class="route-fact"><span>节省</span><b>￥${Math.max(0, Number(trip.val || 0) - Number(trip.price || 0))}</b></div></div>
      ${guide ? `<div class="ok-note">已匹配「${esc(route.name)}」完整攻略：${guide.schedule.length} 个日程节点、${guide.attractions.length} 个景点。</div><section class="detail-section"><div class="detail-section-head"><h4>详细分时路线</h4><span>用户端“我的行程”同源</span></div><div class="timeline-list">${guide.schedule.map((stop) => `<article class="timeline-stop"><time>${esc(stop[0])}</time><b>${esc(stop[1])}</b><p>${esc(stop[2])} · ${esc(stop[3])}</p></article>`).join("")}</div></section><section class="detail-section"><div class="detail-section-head"><h4>沿途景点</h4><span>${guide.attractions.length} 个</span></div>${guide.attractions.map((item) => `<article class="attraction-admin"><div class="attraction-admin-head"><b>${esc(item[0])}</b><span>${esc(item[1])}</span></div><p>${esc(item[2])}</p><div class="attraction-meta"><div><strong>核心看点</strong>${esc(item[3])}</div><div><strong>游览提醒</strong>${esc(item[4])}</div></div></article>`).join("")}</section><button class="btn-sage btn-block" type="button" id="openTripGuide">进入线路攻略管理</button>` : '<div class="risk-note" style="margin-top:14px;">该行程没有匹配到线路攻略，请核对线路名称或 routeId。</div>'}
      <button class="btn-ghost btn-block" type="button" id="closeTrip" style="margin-top:10px;">关闭</button>
    `);
    if (guide) $("#openTripGuide").addEventListener("click", () => showRouteGuide(route.id));
    $("#closeTrip").addEventListener("click", closeDrawer);
  }

  function renderUsers() {
    const list = mergedUsers();
    $("#view-users").innerHTML = `
      <div class="page-head"><div><h2>到店的客人</h2><p>微信登录会同步微信名；未绑手机也会显示</p></div></div>
      <div class="sheet"><table>
        <thead><tr><th>ID</th><th>昵称 / 微信名</th><th>渠道</th><th>出行</th><th>社区</th><th>称号</th><th>累计消费</th><th>省钱</th><th>最近</th><th></th></tr></thead>
        <tbody>
          ${list.map((u) => {
            const postCount = u.posts == null ? communityPosts().filter((post) => post.author === u.name).length : u.posts;
            return `
            <tr>
              <td>${u.id}${u.live ? `<div style="font-size:10px;color:var(--sage-deep);">当前</div>` : ""}</td>
              <td>${guestCell(u)}</td>
              <td>${u.ch}</td><td>${u.trips}</td>
              <td>${postCount}</td>
              <td><span class="pill">${u.title}</span></td>
              <td>￥${u.spend}</td><td>￥${u.saved}</td>
              <td>${u.last}</td>
              <td><button class="linkish" data-user="${u.id}" type="button">档案</button></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table></div>
    `;
    $$("#view-users [data-user]").forEach((b) => b.addEventListener("click", () => showUser(+b.dataset.user)));
  }

  function showUser(id) {
    const u = mergedUsers().find((x) => x.id === id);
    if (!u) return;
    const userOrders = u.orders == null ? mergedOrders().filter((order) => order.user === u.name).length : u.orders;
    const userPosts = u.posts == null ? communityPosts().filter((post) => post.author === u.name).length : u.posts;
    const userBadges = u.badges == null ? db.badges.filter((badge) => badge.unlock > 0).slice(0, Math.min(u.trips, 3)).length : u.badges;
    openDrawer(`
      <h3>${u.name}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">${u.title} · ${u.on ? "正常" : "已禁用"}${u.wxName ? " · 微信 " + u.wxName : ""}</p>
      <div class="toolbar" id="userTabs">
        ${["身份", "偏好", "资产", "成长"].map((t, i) => `<button class="chip ${i === 0 ? "on" : ""}" data-ut="${i}" type="button">${t}</button>`).join("")}
      </div>
      <div id="userPane"></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn-ink" type="button" id="togUser" style="flex:1">${u.on ? "禁用账号" : "启用账号"}</button>
        <button class="btn-ghost" type="button" id="closeU">关闭</button>
      </div>
    `);
    const panes = [
      [["用户 ID", u.id], ["微信名", u.wxName || (u.ch === "微信" ? u.name : "未绑定微信")], ["手机", u.phone || "未绑定"], ["渠道", u.ch], ["最近登录", u.last], ["状态", u.on ? "正常" : "禁用"]],
      [["最近心情", MOOD[u.mood] || u.mood], ["旅行人格", u.person], ["常驻", "未填"]],
      [["订单", userOrders + " 笔"], ["有效行程", u.trips + " 次"], ["已解锁徽章", userBadges + " 枚"], ["社区发布", userPosts + " 篇"]],
      [["出行次数", u.trips], ["累计消费", "￥" + u.spend], ["累计省钱", "￥" + u.saved], ["公益里程", u.trips + " km"], ["社区贡献", userPosts + " 篇"]],
    ];
    const draw = (i) => {
      $("#userPane").innerHTML = panes[i].map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`).join("");
    };
    draw(0);
    $$("#userTabs .chip").forEach((c) => c.addEventListener("click", () => {
      $$("#userTabs .chip").forEach((x) => x.classList.remove("on"));
      c.classList.add("on"); draw(+c.dataset.ut);
    }));
    $("#closeU").addEventListener("click", closeDrawer);
    $("#togUser").addEventListener("click", () => {
      u.on = !u.on; closeDrawer(); toast(u.on ? "已启用" : "已禁用，不可开盒"); renderUsers();
    });
  }

  function renderStats() {
    $("#view-stats").innerHTML = `
      <div class="page-head"><div><h2>经营台账</h2><p>近 7 天 · 支付成功且未退款</p></div>
        <div class="toolbar" style="margin:0">${["今日", "近 7 天", "近 30 天"].map((t, i) => `<button class="chip ${i === 1 ? "on" : ""}" type="button">${t}</button>`).join("")}</div>
      </div>
      <div class="kpi-strip" style="margin-bottom:16px;">
        ${[["开盒量", "312"], ["成交额", "￥48,620"], ["客单价", "￥156"], ["退款率", "4.1%"], ["新增", "128"]].map(([k, v]) => `<div class="kpi"><b>${v}</b><span>${k}</span></div>`).join("")}
      </div>
      <div class="two-col">
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">转化漏斗</div>
          <div class="funnel">
            ${[["访问", 100], ["选心情", 72], ["浏览盲盒", 61], ["点击开盒", 28], ["创单", 19], ["支付", 16], ["开盒完成", 15]].map(([n, p]) => `
              <div class="funnel-row"><span>${n}</span><div class="bar"><b style="width:${p}%"></b></div><b>${p}%</b></div>`).join("")}
          </div>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">称号分布</div>
          <div class="donut-wrap">
            <div class="donut"></div>
            <div class="legend">
              <div><b>旅行新手</b> 46%</div>
              <div><b>探索者</b> 28%</div>
              <div><b>旅行家</b> 26%</div>
            </div>
          </div>
          <div class="section-title" style="font-size:15px;margin:16px 0 8px;">心情选择</div>
          ${[["开心", 34], ["emo", 29], ["无聊", 18], ["迷茫", 19]].map(([n, p]) => `
            <div class="funnel-row"><span>${n}</span><div class="bar"><b style="width:${p * 2.4}%"></b></div><b>${p}%</b></div>`).join("")}
        </div>
      </div>
    `;
  }

  function renderSettings() {
    const s = db.settings;
    $("#view-settings").innerHTML = `
      <div class="page-head"><div><h2>后场规则</h2><p>改的是用户端能看见的句子，和开盒超时</p></div>
        <button class="btn-sage" type="button" id="saveSet">保存设置</button></div>
      <div class="two-col">
        <div class="paper">
          <div class="field"><label>价值保底文案</label><textarea id="sGua">${s.guarantee}</textarea></div>
          <div class="field"><label>情绪匹配文案</label><textarea id="sMood">${s.moodCopy}</textarea></div>
          <div class="form-grid">
            <div class="field"><label>公益（元 / 单）</label><input id="sVil" type="number" value="${s.village}" /></div>
            <div class="field"><label>待支付超时（分）</label><input id="sTo" type="number" value="${s.timeout}" /></div>
          </div>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:8px;">出行次数 → 称号</div>
          ${s.levels.map((lv) => `<div class="todo-row"><span>${lv[0]}–${lv[1]} 次</span><strong>${lv[2]}</strong></div>`).join("")}
          <div class="section-title" style="font-size:15px;margin:16px 0 8px;">演示身份</div>
          <div class="toolbar">
            ${["超级管理员", "运营", "客服", "财务", "数据分析"].map((r, i) => `<button class="chip ${i === 0 ? "on" : ""}" data-role="${r}" type="button">${r}</button>`).join("")}
          </div>
        </div>
      </div>
    `;
    $("#saveSet").addEventListener("click", () => {
      db.settings.guarantee = $("#sGua").value;
      db.settings.moodCopy = $("#sMood").value;
      db.settings.village = +$("#sVil").value;
      db.settings.timeout = +$("#sTo").value;
      toast("规则已写入后厨");
    });
    $$("#view-settings [data-role]").forEach((b) => b.addEventListener("click", () => {
      $$("#view-settings [data-role]").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      $("#roleTitle").textContent = b.dataset.role;
      toast("演示身份：" + b.dataset.role);
    }));
  }

  function renderTokens() {
    const colors = [
      ["#F6F1E6", "Cream", "画布"],
      ["#E4EDD8", "Sage mist", "云朵顶"],
      ["#8EA47C", "Sage", "按钮 / TOP"],
      ["#6C7E58", "Sage deep", "图标描边"],
      ["#3C342C", "Ink", "标题"],
      ["#8F8376", "Muted", "说明"],
      ["#FFFDF8", "Paper", "卡片"],
      ["#E7DCCE", "Line", "分割"],
      ["#D4924A", "Caramel", "Good Morning"],
      ["#E8B4A2", "Blush", "退款提示"],
    ];
    $("#view-tokens").innerHTML = `
      <div class="page-head"><div><h2>和橱窗同一套颜料</h2><p>用户端 docs/页面原型.html 已用同一组 token</p></div></div>
      <div class="swatch-grid">
        ${colors.map(([hex, en, zh]) => `<div class="swatch"><i style="background:${hex}"></i><p>${zh}<span>${en} · ${hex}</span></p></div>`).join("")}
      </div>
      <div class="two-col" style="margin-top:18px;">
        <div class="paper type-card">
          <div class="cursive">Good Morning!</div>
          <div class="shop-title">途个惊喜</div>
          <p>Caveat 手写问候 · Noto Serif SC 店名 · Noto Sans SC 正文</p>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">元件节奏</div>
          <div class="todo-row"><span>搜索</span><span>白胶囊 + 鼠尾草圆钮</span></div>
          <div class="todo-row"><span>主按钮</span><span>满绿胶囊，hover 转 deep</span></div>
          <div class="todo-row"><span>卡片</span><span>纸色、14–18 圆角、一层淡影</span></div>
          <div class="todo-row"><span>加号</span><span>26px 绿圆，对齐参考图 +</span></div>
          <div class="todo-row"><span>顶栏</span><span>鼠尾草云朵 + 奶油扇贝</span></div>
        </div>
      </div>
    `;
  }

  const renders = {
    dash: renderDash, boxes: renderBoxes, routes: renderRoutes, badges: renderBadges,
    banners: renderBanners, ai: renderAi, quiz: renderQuiz,
    community: renderCommunity, comments: renderComments, checkins: renderCheckins, orders: renderOrders,
    refunds: renderRefunds, trips: renderTrips, users: renderUsers, stats: renderStats,
    settings: renderSettings, tokens: renderTokens,
  };

  let demoRole = "超级管理员";

  function enter() {
    $("#loginStage").hidden = true;
    $("#app").hidden = false;
    document.body.classList.add("app-on");
    $("#helloScript").textContent = hourGreet();
    $("#roleTitle").textContent = demoRole;
    $("#scallops").innerHTML = Array.from({ length: 10 }, () => "<i></i>").join("");
    const scallop = $$("#scallops i");
    scallop.forEach((el, i) => {
      el.style.left = (i * 11 - 2) + "%";
      el.style.width = (58 + (i % 3) * 10) + "px";
      el.style.height = (26 + (i % 4) * 4) + "px";
    });
    const ava = $("#roleAva");
    ava.innerHTML = I.ai;
    renderNav();
    go("dash");
  }

  const loginHello = $("#loginHello");
  if (loginHello) loginHello.textContent = hourGreet();
  $("#togglePass")?.addEventListener("click", () => {
    const inp = $("#loginPass");
    inp.type = inp.type === "password" ? "text" : "password";
  });
  $$("#loginRoles .chip").forEach((b) => b.addEventListener("click", () => {
    $$("#loginRoles .chip").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    demoRole = b.dataset.role;
  }));

  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    enter();
  });
  $("#drawerMask").addEventListener("click", (e) => {
    if (e.target === $("#drawerMask")) closeDrawer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
  $("#globalSearchBtn").addEventListener("click", () => {
    const q = $("#globalSearch").value.trim();
    if (!q) return toast("写个盒子名、单号或昵称");
    const box = db.boxes.find((b) => b.name.includes(q));
    const order = mergedOrders().find((o) => o.no.includes(q) || (o.user && o.user.includes(q)));
    const user = mergedUsers().find((u) => u.name.includes(q) || (u.wxName && u.wxName.includes(q)));
    if (box) { go("boxes"); toast("找到盲盒：" + box.name); return; }
    if (order) { go("orders"); showOrder(order.no); return; }
    if (user) { go("users"); showUser(user.id); return; }
    toast("橱窗里暂时没有这味");
  });
  $("#todoBell").addEventListener("click", () => go("refunds"));
  window.addEventListener("storage", (e) => {
    if (e.key === LEDGER_KEY && (page === "orders" || page === "refunds" || page === "dash")) {
      renders[page]();
    }
  });

  if (location.hash && location.hash !== "#") {
    const h = location.hash.replace("#", "");
    enter();
    if (h !== "app" && TITLES[h]) go(h);
  }
})();
