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
    dash: ["工作台", "今日出炉数据，像看橱窗一样扫一眼"],
    boxes: ["盲盒管理", "首页货架上的盒子，在这里上下架"],
    routes: ["线路管理", "开盒随机池 · 票面须盖过保底"],
    badges: ["徽章管理", "图鉴里的十二枚印章"],
    banners: ["运营位", "用户端首页那条鼠尾草横幅"],
    ai: ["AI 搭子 · 小途", "人设、降级话术与日记配方"],
    quiz: ["人格测试", "五道题，四种旅行人格"],
    orders: ["订单与支付", "待支付 → 已支付 → 已开盒"],
    refunds: ["退款审核", "未出行退换，原路退回"],
    trips: ["行程记录", "开盒后的线路快照，只读查询"],
    users: ["用户管理", "身份 / 偏好 / 资产 / 成长 四层档案"],
    stats: ["数据统计", "支付成功且未退款才计入成交"],
    settings: ["系统设置", "规则文案、等级、公益与账号"],
    tokens: ["视觉规范", "完全复刻烘焙店参考图的奶油与鼠尾草"],
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

  const LEDGER_KEY = "TUGE_LEDGER";
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
    const hot = db.boxes[1];
    const wait = mergedRefunds().filter((r) => r.st === "wait").length;
    $("#view-dash").innerHTML = `
      <div class="special-block">
        <div class="special-photo">
          <img src="${hot.img}" alt="" />
          <div class="v-label">TODAY'S SPECIAL</div>
          <div class="photo-tag">BAKERY<br>HANDMADE</div>
          <div class="fresh-orb">今日<br>新鲜出炉</div>
        </div>
        <div class="special-copy">
          <div class="eyebrow">TODAY'S SPECIAL</div>
          <h2>${hot.name}</h2>
          <p>${hot.desc}<br>开盒 ${hot.opens} 次 · 保底 ￥${hot.guarantee}</p>
          <button class="link-cta" type="button" data-go="boxes">去货架维护 →</button>
          <div class="kpi-strip">
            <div class="kpi"><b>47</b><span>今日开盒</span></div>
            <div class="kpi"><b>￥8246</b><span>今日成交</span></div>
            <div class="kpi"><b>94.2%</b><span>支付成功</span></div>
          </div>
        </div>
      </div>

      <div class="cat-row">
        ${[
          ["boxes", "盲盒", "BOX"],
          ["routes", "线路", "ROUTE"],
          ["orders", "订单", "ORDER"],
          ["refunds", "退款", "GIFT"],
        ].map(([id, n, e]) => `
          <button class="cat-item" type="button" data-go="${id}">
            <div class="cat-icon">${catIcon(id)}</div>
            <strong>${n}</strong><em>${e}</em>
          </button>`).join("")}
      </div>

      <div class="member-banner">
        <div class="copy">
          <div class="kicker">MEMBER BENEFITS</div>
          <h3>待审核退款 ${wait} 笔，抽奖失败自动退 1 笔</h3>
          <button class="btn-ink" type="button" data-go="refunds" style="height:30px;padding:0 12px;font-size:12px;">立即处理</button>
        </div>
        <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80" alt="" />
      </div>

      <div class="section-header">
        <div class="section-title">人气货架
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#8EA47C"><path d="M12 21s-7-4.4-9.5-9.2C.6 8.2 2.2 5 5.4 5c1.8 0 3.2 1 3.9 2.4C10 6 11.4 5 13.2 5c3.2 0 4.8 3.2 2.9 6.8C19 16.6 12 21 12 21z"/></svg>
        </div>
        <button class="view-more" type="button" data-go="boxes">查看更多 →</button>
      </div>
      <div class="product-grid trio">
        ${top.map((b, i) => `
          <article class="product-card">
            <div class="prod-img-wrap">
              <img src="${b.img}" alt="" />
              <div class="top-badge">TOP${i + 1}</div>
            </div>
            <div class="prod-info">
              <div class="prod-name">${b.name}</div>
              <div class="prod-desc">开盒 ${b.opens} 次 · ${CAT[b.category]}</div>
              <div class="prod-bottom">
                <div class="prod-price"><span>￥</span>${b.price}</div>
                <button class="btn-add" type="button" data-edit-box="${b.id}">+</button>
              </div>
            </div>
          </article>`).join("")}
      </div>

      <div class="two-col">
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:8px;">近 7 日开盒</div>
          <div class="spark">${[40, 52, 36, 70, 58, 78, 60].map((n) => `<i style="height:${n}%"></i>`).join("")}</div>
          <div class="spark-cap"><span>09-11</span><span>09-17</span></div>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:4px;">今日待办</div>
          ${[
            ["待支付超时", "5 笔", "orders"],
            ["待审核退款", wait + " 笔", "refunds"],
            ["抽奖失败自动退", "1 笔", "refunds"],
            ["下架美食专线", "池校验", "boxes"],
          ].map(([a, b, g]) => `
            <div class="todo-row">
              <span>${a}</span>
              <button class="linkish" type="button" data-go="${g}">${b} →</button>
            </div>`).join("")}
        </div>
      </div>
    `;
    bindGo("#view-dash");
    $$("#view-dash [data-edit-box]").forEach((b) => b.addEventListener("click", () => editBox(b.dataset.editBox)));
  }

  function bindGo(scope) {
    $$(scope + " [data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
  }

  function boxCard(b) {
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
            <button class="btn-add" type="button" data-edit-box="${b.id}">+</button>
          </div>
          <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
            <span class="pill ${b.status === "on" ? "ok" : "wait"}">${b.status === "on" ? "上架" : "下架"}</span>
            <span style="font-size:11px;color:var(--muted);">${CAT[b.category]}</span>
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
      <p style="font-size:12px;color:var(--muted);margin-bottom:16px;">封面沿用旅行照片，不画假面包</p>
      <div class="form-grid">
        <div class="field span2"><label>名称</label><input id="fName" value="${b.name}" /></div>
        <div class="field"><label>分类</label>
          <select id="fCat">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${b.category === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        </div>
        <div class="field"><label>展示标签</label><input id="fTag" value="${b.tag}" /></div>
        <div class="field"><label>售价</label><input id="fPrice" type="number" value="${b.price}" /></div>
        <div class="field"><label>保底价值</label><input id="fGua" type="number" value="${b.guarantee}" /></div>
        <div class="field span2"><label>简介</label><input id="fDesc" value="${b.desc}" /></div>
        <div class="field span2"><label>适配心情</label>
          <div class="moods" id="fMoods">
            ${Object.entries(MOOD).map(([k, v]) => `<label class="check"><input type="checkbox" value="${k}" ${b.moods.includes(k) ? "checked" : ""}/> ${v}</label>`).join("")}
          </div>
        </div>
        <div class="field"><label>状态</label>
          <select id="fSt"><option value="on" ${b.status === "on" ? "selected" : ""}>上架</option><option value="off" ${b.status === "off" ? "selected" : ""}>下架</option></select>
        </div>
        <div class="field"><label>排序</label><input id="fSort" type="number" value="${b.sort}" /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" id="saveBox" style="flex:1">放入货架</button>
        <button class="btn-ghost" type="button" id="closeBox">取消</button>
      </div>
    `);
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
      const i = db.boxes.findIndex((x) => x.id === next.id);
      if (i >= 0) db.boxes[i] = next; else db.boxes.unshift(next);
      closeDrawer();
      toast(isNew && i < 0 ? "新盒子已上架草稿" : "货架已更新");
      renderBoxes();
    });
  }

  function renderRoutes() {
    $("#view-routes").innerHTML = `
      <div class="page-head">
        <div><h2>线路池</h2><p>同分类下须有线路票面 ≥ 盲盒保底，否则开盒失败</p></div>
        <button class="btn-sage" type="button" id="newRoute">新建线路</button>
      </div>
      <div class="sheet"><table>
        <thead><tr><th>线路</th><th>目的地</th><th>分类</th><th>票面</th><th>徽章</th><th>抽中</th><th>状态</th><th></th></tr></thead>
        <tbody>
          ${db.routes.map((r) => `
            <tr>
              <td><div class="who"><img class="thumb" src="${r.img}" alt="" /><div><strong>${r.name}</strong><div style="font-size:11px;color:var(--muted);">${r.moodText}</div></div></div></td>
              <td>${r.dest}</td>
              <td>${CAT[r.category]}</td>
              <td>￥${r.value}</td>
              <td><span class="pill">${r.badge}</span></td>
              <td>${r.draws}</td>
              <td><span class="pill ${r.status === "on" ? "ok" : "wait"}">${r.status === "on" ? "启用" : "停用"}</span></td>
              <td><button class="linkish" data-edit-route="${r.id}" type="button">编辑</button></td>
            </tr>`).join("")}
        </tbody>
      </table></div>
    `;
    $("#newRoute").addEventListener("click", () => editRoute(null));
    $$("#view-routes [data-edit-route]").forEach((b) => b.addEventListener("click", () => editRoute(b.dataset.editRoute)));
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
      };
      const i = db.routes.findIndex((x) => x.id === next.id);
      if (i >= 0) db.routes[i] = next; else db.routes.unshift(next);
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
    const [lab] = ORDER_ST[o.st];
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
      <button class="btn-ghost btn-block" style="margin-top:18px;" type="button" id="closeO">收起</button>
    `);
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
    let extra = [];
    try {
      const s = JSON.parse(localStorage.getItem("TUGE_APP_STORE") || "{}");
      extra = (s.trips || []).map((t) => ({
        user: (s.user && s.user.nickname) || "途友",
        wxName: (s.user && (s.user.wxName || (s.user.channel === "微信" ? s.user.nickname : ""))) || "",
        ch: (s.user && s.user.channel) || "",
        route: t.name,
        dest: t.dest,
        date: t.date,
        price: t.price,
        val: t.val,
        ok: t.valid !== false,
      }));
    } catch (e) {}
    const list = [...extra, ...db.trips];
    $("#view-trips").innerHTML = `
      <div class="page-head"><div><h2>行程本</h2><p>客服查阅用，一般不改</p></div></div>
      <div class="product-grid">
        ${list.map((t) => `
          <article class="product-card" style="${t.ok ? "" : "opacity:.55"}">
            <div class="prod-info">
              <div class="eyebrow">${t.date} · ${t.user}${t.wxName ? " · 微信 " + t.wxName : ""}</div>
              <div class="prod-name">${t.route}</div>
              <div class="prod-desc">${t.dest}</div>
              <div class="prod-bottom">
                <div class="prod-price"><span>￥</span>${t.val}</div>
                <span class="pill ${t.ok ? "ok" : "bad"}">${t.ok ? "有效" : "已退款"}</span>
              </div>
            </div>
          </article>`).join("")}
      </div>
    `;
  }

  function renderUsers() {
    const list = mergedUsers();
    $("#view-users").innerHTML = `
      <div class="page-head"><div><h2>到店的客人</h2><p>微信登录会同步微信名；未绑手机也会显示</p></div></div>
      <div class="sheet"><table>
        <thead><tr><th>ID</th><th>昵称 / 微信名</th><th>渠道</th><th>出行</th><th>称号</th><th>累计消费</th><th>省钱</th><th>最近</th><th></th></tr></thead>
        <tbody>
          ${list.map((u) => `
            <tr>
              <td>${u.id}${u.live ? `<div style="font-size:10px;color:var(--sage-deep);">当前</div>` : ""}</td>
              <td>${guestCell(u)}</td>
              <td>${u.ch}</td><td>${u.trips}</td>
              <td><span class="pill">${u.title}</span></td>
              <td>￥${u.spend}</td><td>￥${u.saved}</td>
              <td>${u.last}</td>
              <td><button class="linkish" data-user="${u.id}" type="button">档案</button></td>
            </tr>`).join("")}
        </tbody>
      </table></div>
    `;
    $$("#view-users [data-user]").forEach((b) => b.addEventListener("click", () => showUser(+b.dataset.user)));
  }

  function showUser(id) {
    const u = mergedUsers().find((x) => x.id === id);
    if (!u) return;
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
      [["有效订单", u.trips + " 笔"], ["聊天 / 日记", "摘要见正式环境"], ["徽章", "见行程解锁"]],
      [["出行次数", u.trips], ["累计消费", "￥" + u.spend], ["累计省钱", "￥" + u.saved], ["公益里程", u.trips + " km"]],
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
    banners: renderBanners, ai: renderAi, quiz: renderQuiz, orders: renderOrders,
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
