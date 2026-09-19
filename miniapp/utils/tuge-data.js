const TUGE_BOXES = [
  { id: 'box_1', rank: 'TOP1', name: '周边微度假盲盒', category: 'nearby', desc: '1天短途，周末说走就走', price: 99, guarantee: 120, moods: ['happy', 'emo', 'bored'], img: '/assets/covers/box1.jpg' },
  { id: 'box_2', rank: 'TOP2', name: '隐世古村慢生活盒', category: 'nearby', desc: '青石古街，非遗打糍粑', price: 129, guarantee: 160, moods: ['emo', 'curious'], img: '/assets/covers/box2.jpg' },
  { id: 'box_3', rank: 'TOP3', name: '山野露营观星盲盒', category: 'nearby', desc: '湖畔星空，篝火治愈夜', price: 159, guarantee: 200, moods: ['emo', 'curious', 'bored'], img: '/assets/covers/box3.jpg' },
  { id: 'box_4', rank: 'HOT', name: '省内仙山问道二日', category: 'province', desc: '云海奇峰，探秘古建', price: 299, guarantee: 380, moods: ['happy', 'curious'], img: '/assets/covers/box4.jpg' },
  { id: 'box_5', rank: 'NEW', name: '跨省限定冒险盲盒', category: 'cross', desc: '大山大河，说走就走', price: 599, guarantee: 750, moods: ['bored', 'curious'], img: '/assets/covers/box5.jpg' },
  { id: 'box_6', rank: 'HOT', name: '老城寻味美食专线', category: 'theme', desc: '街角早茶，烟火气', price: 119, guarantee: 150, moods: ['happy', 'bored'], img: '/assets/covers/box6.jpg' },
]

const TUGE_ROUTES = [
  { id: 'r1', category: 'nearby', name: '渼陂古村非遗一日游', dest: '吉安 · 青原区', value: 148, badge: '古村', moodText: '古村的风会吹走所有烦恼', img: '/assets/covers/box2.jpg' },
  { id: 'r2', category: 'nearby', name: '云雾茶山徒步采风', dest: '武夷山周边', value: 135, badge: '山野', moodText: '穿过云雾，听见心跳', img: '/assets/covers/box1.jpg' },
  { id: 'r3', category: 'nearby', name: '湖畔星空营地之夜', dest: '仙女湖畔', value: 218, badge: '露营', moodText: '星空不说话，但够温暖', img: '/assets/covers/box3.jpg' },
  { id: 'r4', category: 'province', name: '三清山松云问道二日', dest: '上饶 · 玉山', value: 420, badge: '徽派', moodText: '站在高处，天地开朗', img: '/assets/covers/box4.jpg' },
  { id: 'r5', category: 'cross', name: '大理苍山洱海', dest: '云南 · 大理', value: 880, badge: '文艺', moodText: '去有风的地方重新开始', img: '/assets/covers/box5.jpg' },
  { id: 'r6', category: 'theme', name: '西关深巷寻味记', dest: '广州 · 西关', value: 168, badge: '美食', moodText: '烟火气是最好的良药', img: '/assets/covers/box6.jpg' },
]

const TUGE_BADGES = [
  { name: '古村', mark: '村' }, { name: '山野', mark: '山' }, { name: '美食', mark: '味' },
  { name: '徽派', mark: '徽' }, { name: '文艺', mark: '文' }, { name: '海滨', mark: '海' },
  { name: '红色', mark: '红' }, { name: '乡村', mark: '乡' }, { name: '探险', mark: '探' },
  { name: '露营', mark: '营' }, { name: '研学', mark: '学' }, { name: '摄影', mark: '影' },
]

const SERVICE_BY_CAT = {
  nearby: ['往返交通', '午餐一份', '向导陪同'],
  province: ['大巴往返', '两日住宿', '向导陪同', '景区门票'],
  cross: ['交通衔接', '住宿', '向导', '行程保险'],
  theme: ['市内交通', '美食体验', '向导讲解'],
}

const TEST_QUESTIONS = [
  {
    question: '周末有空你更倾向于？',
    options: [
      { text: '宅家躺平，哪儿也不想去', score: { nature: 2 } },
      { text: '约朋友逛街吃美食', score: { city: 3 } },
      { text: '去周边爬爬山逛公园', score: { nature: 3 } },
      { text: '打卡网红景点拍照', score: { city: 2 } },
    ],
  },
  {
    question: '旅行时你最看重什么？',
    options: [
      { text: '风景好，人少安静', score: { nature: 3 } },
      { text: '美食多，吃得开心', score: { city: 3 } },
      { text: '有文化底蕴，能涨见识', score: { culture: 3 } },
      { text: '刺激好玩，有挑战性', score: { adventure: 3 } },
    ],
  },
  {
    question: '心情不好你会怎么调节？',
    options: [
      { text: '找个没人的地方发呆', score: { nature: 3 } },
      { text: '大吃一顿治愈自己', score: { city: 3 } },
      { text: '出去走走散散心', score: { nature: 2 } },
      { text: '找朋友聊天吐槽', score: { city: 2 } },
    ],
  },
  {
    question: '你喜欢什么样的旅行节奏？',
    options: [
      { text: '慢节奏，睡到自然醒', score: { nature: 3 } },
      { text: '紧凑点，多逛几个地方', score: { city: 2, adventure: 1 } },
      { text: '随心所欲，走到哪算哪', score: { adventure: 3 } },
      { text: '提前做好详细攻略', score: { culture: 3 } },
    ],
  },
  {
    question: '你理想的旅行伙伴是？',
    options: [
      { text: '独自一人，享受自由', score: { nature: 1, adventure: 2 } },
      { text: '和最好的朋友一起', score: { city: 3 } },
      { text: '和家人一起', score: { culture: 3 } },
      { text: '认识新朋友也不错', score: { adventure: 2, city: 1 } },
    ],
  },
]

const PERSONALITY_RESULTS = [
  { type: 'nature', name: '山野治愈家', mark: '野', desc: '你偏爱安静自然的旅行，在山水间找回内心的平静。', recommend: '山野徒步、古村慢游、露营观星类盲盒最适合你。' },
  { type: 'city', name: '城市探险家', mark: '城', desc: '你热爱城市的烟火气，在美食与探店中收获快乐。', recommend: '城市探店、美食专线、都市潮玩类盲盒最适合你。' },
  { type: 'adventure', name: '追风冒险者', mark: '风', desc: '你喜欢未知与挑战，永远对下一站充满期待。', recommend: '跨省限定、户外探险、小众秘境类盲盒最适合你。' },
  { type: 'culture', name: '人文记录者', mark: '文', desc: '你钟情于历史与文化，在旅途中探索精神的厚度。', recommend: '红色研学、非遗体验、古镇人文类盲盒最适合你。' },
]

const AI_GREET = '你好呀～我是小途。今天想吹吹山风，还是找个古村坐下来？把心情告诉我。'
const DEMO_SMS = '123456'
const LEDGER_KEY = 'TUGE_LEDGER'
const STORE_KEY = 'TUGE_APP_STORE'

const MOODS = [
  { key: 'all', label: '全部心情' },
  { key: 'happy', label: '开心' },
  { key: 'emo', label: 'emo' },
  { key: 'bored', label: '无聊' },
  { key: 'curious', label: '迷茫' },
]

const CATEGORIES = [
  { key: 'nearby', label: '周边游', english: 'NEARBY' },
  { key: 'province', label: '省内游', english: 'PROVINCE' },
  { key: 'cross', label: '跨省游', english: 'CROSS' },
  { key: 'theme', label: '主题盒', english: 'THEME' },
]

const ORDER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_pay', label: '待支付' },
  { key: 'opened', label: '已开盒' },
  { key: 'refund', label: '退款' },
]

const REFUND_REASONS = [
  { key: '未出行退换 · 行程冲突', label: '行程冲突' },
  { key: '计划变更', label: '计划变更' },
  { key: '未出行退换 · 其他', label: '其他原因' },
]

module.exports = {
  TUGE_BOXES,
  TUGE_ROUTES,
  TUGE_BADGES,
  SERVICE_BY_CAT,
  TEST_QUESTIONS,
  PERSONALITY_RESULTS,
  AI_GREET,
  DEMO_SMS,
  LEDGER_KEY,
  STORE_KEY,
  MOODS,
  CATEGORIES,
  ORDER_TABS,
  REFUND_REASONS,
}
