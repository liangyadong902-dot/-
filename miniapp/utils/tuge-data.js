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
  { key: 'guide', label: '纯攻略', english: 'GUIDE' },
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
