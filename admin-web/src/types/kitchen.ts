export type Category = 'nearby' | 'province' | 'cross' | 'theme' | 'guide'
export type Mood = 'happy' | 'emo' | 'bored' | 'curious'
export type ShelfStatus = 'on' | 'off'
export type OrderStatus = 'pending_pay' | 'paid' | 'opened' | 'cancelled' | 'refunded'
export type RefundStatus = 'wait' | 'done' | 'reject'
export type NavIconName =
  | 'dash'
  | 'box'
  | 'route'
  | 'badge'
  | 'banner'
  | 'ai'
  | 'quiz'
  | 'order'
  | 'refund'
  | 'trip'
  | 'user'
  | 'stats'
  | 'set'
  | 'pal'

export interface BlindBox {
  id: string
  rank: string
  name: string
  category: Category
  tag: string
  desc: string
  price: number
  guarantee: number
  moods: Mood[]
  img: string
  status: ShelfStatus
  sort: number
  opens: number
}

export interface RouteGuide {
  overview: string
  durationText: string
  paceText: string
  walkText: string
  transitText: string
  season: string
  weather: string
  facts: { label: string; value: string }[]
  schedules: { dayNo: number; time: string; title: string; description: string; addr?: string; tip?: string }[]
  spots: { name: string; coverUrl?: string; highlights?: string; notice?: string; durationMinutes?: number; addr?: string }[]
  transport: { title: string; description: string }[]
  dining: { title: string; description: string; addr?: string }[]
  lodging: { title: string; description: string }[]
  budgetItems: { name: string; amount: number; required?: boolean }[]
  checklist: string[]
  planB: string
  safetyTips: string[]
  faqs: { question: string; answer: string }[]
  rules: { title: string; description: string }[]
}

export interface TravelRoute {
  id: string
  badgeId?: number
  name: string
  dest: string
  category: Category
  value: number
  cost?: number | null
  scene?: string
  badge: string
  moodText: string
  highlights: string
  includes: string
  status: ShelfStatus
  img: string
  draws: number
  guide?: RouteGuide
  guideVersion?: number
}

export interface BadgeItem {
  id?: string
  name: string
  mark: string
  description?: string
  sortWeight?: number
  unlock: number
  routes: number
}

export interface BannerItem {
  id: string
  title: string
  sub: string
  tag: string
  to: string
  on: boolean
  img: string
  jumpType?: string
  jumpTarget?: string | null
  startAt?: string | null
  endAt?: string | null
  sortWeight?: number
}

export interface OrderItem {
  no: string
  user: string
  phone: string
  box: string
  pay: number
  ch: string
  st: OrderStatus
  route: string
  time: string
  wxName?: string
  name?: string
  loginCh?: string
  channel?: string
}

export interface RefundItem {
  no: string
  order: string
  user: string
  reason: string
  amount: number
  type: '人工' | '自动'
  st: RefundStatus
  phone?: string
  wxName?: string
  name?: string
  ch?: string
}

export interface TripItem {
  user: string
  route: string
  dest: string
  date: string
  price: number
  val: number
  ok: boolean
  wxName?: string
  ch?: string
}

export interface GuestUser {
  id: number
  name: string
  wxName: string
  phone: string
  ch: string
  trips: number
  title: string
  spend: number
  saved: number
  last: string
  on: boolean
  mood: string
  person: string
  live?: boolean
}

export interface QuizItem {
  n: number
  q: string
  a: string[]
}

export interface PersonType {
  type: string
  name: string
  rec: string
}

export interface AiRecipe {
  greet: string
  prompt: string
  quick: string[]
  fallback: string[]
  diary: string
}

export interface KitchenSettings {
  guarantee: string
  moodCopy: string
  village: number
  timeout: number
  levels: [number, number, string][]
}

export type GuestLike = {
  name?: string
  user?: string
  wxName?: string
  phone?: string
  ch?: string
  loginCh?: string
  channel?: string
  nickname?: string
}

export type DrawerState =
  | { type: 'box'; id: string | null }
  | { type: 'route'; id: string | null }
  | { type: 'pool'; id: string }
  | { type: 'badge'; id: string | null }
  | { type: 'banner'; id: string | null }
  | { type: 'order'; no: string }
  | { type: 'user'; id: number }
  | null
