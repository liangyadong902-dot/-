import type { AdminRole } from '@/types'
import type { Category, Mood, NavIconName, OrderStatus } from '@/types/kitchen'

export const CAT: Record<Category, string> = {
  nearby: '周边游',
  province: '省内游',
  cross: '跨省游',
  theme: '主题专线',
}

export const MOOD: Record<Mood, string> = {
  happy: '开心',
  emo: 'emo',
  bored: '无聊',
  curious: '迷茫',
}

export const ORDER_ST: Record<OrderStatus, [string, string]> = {
  pending_pay: ['待支付', 'wait'],
  paid: ['已支付', 'ok'],
  opened: ['已开盒', 'ok'],
  cancelled: ['已取消', 'wait'],
  refunded: ['已退款', 'bad'],
}

export const LOGIN_ROLES = ['超级管理员', '运营', '客服'] as const
export type LoginRole = (typeof LOGIN_ROLES)[number]

export const ROLE_ACCOUNT: Record<LoginRole, string> = {
  超级管理员: 'admin',
  运营: 'operator',
  客服: 'cs',
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: '超级管理员',
  operator: '运营',
  cs: '客服',
  finance: '财务',
  analyst: '数据分析',
}

export const PAGE_PATH: Record<string, string> = {
  dash: '/dashboard',
  stats: '/stats',
  boxes: '/boxes',
  routes: '/routes',
  badges: '/badges',
  banners: '/banners',
  ai: '/ai',
  quiz: '/quiz',
  orders: '/orders',
  refunds: '/refunds',
  trips: '/trips',
  users: '/users',
  settings: '/settings',
  tokens: '/tokens',
}

export const PATH_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_PATH).map(([id, path]) => [path, id]),
)

export const TITLES: Record<string, [string, string]> = {
  dash: ['工作台', '今日出炉数据，像看橱窗一样扫一眼'],
  boxes: ['盲盒管理', '首页货架上的盒子，在这里上下架'],
  routes: ['线路管理', '开盒随机池 · 票面须盖过保底'],
  badges: ['徽章管理', '图鉴里的十二枚印章'],
  banners: ['运营位', '用户端首页那条鼠尾草横幅'],
  ai: ['AI 搭子 · 小途', '人设、降级话术与日记配方'],
  quiz: ['人格测试', '五道题，四种旅行人格'],
  orders: ['订单与支付', '待支付 → 已支付 → 已开盒'],
  refunds: ['退款审核', '未出行退换，原路退回'],
  trips: ['行程记录', '开盒后的线路快照，只读查询'],
  users: ['用户管理', '身份 / 偏好 / 资产 / 成长 四层档案'],
  stats: ['数据统计', '支付成功且未退款才计入成交'],
  settings: ['系统设置', '规则文案、等级、公益与账号'],
  tokens: ['视觉规范', '完全复刻烘焙店参考图的奶油与鼠尾草'],
}

export interface NavItem {
  id: string
  name: string
  path: string
  icon: NavIconName
}

export interface NavGroup {
  g: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    g: '橱窗',
    items: [
      { id: 'dash', name: '工作台', path: '/dashboard', icon: 'dash' },
      { id: 'stats', name: '数据统计', path: '/stats', icon: 'stats' },
    ],
  },
  {
    g: '配方',
    items: [
      { id: 'boxes', name: '盲盒管理', path: '/boxes', icon: 'box' },
      { id: 'routes', name: '线路管理', path: '/routes', icon: 'route' },
      { id: 'badges', name: '徽章管理', path: '/badges', icon: 'badge' },
      { id: 'banners', name: '运营位', path: '/banners', icon: 'banner' },
    ],
  },
  {
    g: '酵母',
    items: [
      { id: 'ai', name: 'AI 搭子', path: '/ai', icon: 'ai' },
      { id: 'quiz', name: '人格测试', path: '/quiz', icon: 'quiz' },
    ],
  },
  {
    g: '账单',
    items: [
      { id: 'orders', name: '订单支付', path: '/orders', icon: 'order' },
      { id: 'refunds', name: '退款审核', path: '/refunds', icon: 'refund' },
      { id: 'trips', name: '行程记录', path: '/trips', icon: 'trip' },
    ],
  },
  {
    g: '客人',
    items: [{ id: 'users', name: '用户管理', path: '/users', icon: 'user' }],
  },
  {
    g: '后场',
    items: [
      { id: 'settings', name: '系统设置', path: '/settings', icon: 'set' },
      { id: 'tokens', name: '视觉规范', path: '/tokens', icon: 'pal' },
    ],
  },
]
