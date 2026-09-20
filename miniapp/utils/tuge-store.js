const data = require('./tuge-data')
const markdown = require('./markdown')
const {
  AI_GREET,
  DEMO_SMS,
  STORE_KEY,
  MOODS,
  CATEGORIES,
  ORDER_TABS,
  REFUND_REASONS,
} = data

const TABS = [
  { key: 'home', path: '/pages/index/index', text: '首页' },
  { key: 'ai', path: '/pages/ai/index', text: 'AI搭子' },
  { key: 'community', path: '/pages/community/index', text: '社区' },
  { key: 'trips', path: '/pages/trips/index', text: '行程' },
  { key: 'mine', path: '/pages/mine/index', text: '我的' },
]

let boxes = []
let badgeCatalog = []
let badgeTotal = 0
let banners = []
let personalityQuestions = []
let aiConfig = { greet: AI_GREET, quickQuestions: [] }
let contentLoaded = false
let contentError = ''

const listeners = []
let payTimer = null
let smsTick = null
let smsToken = ''
let toastTimer = null
let drawTimer = null
let drawStatusTimer = null
let chatTimer = null
let wxLoginBusy = false
let toastSeq = 0

const ui = {
  unbox: false,
  test: false,
  trip: false,
  order: false,
  login: false,
  refund: false,
  unboxStep: 'confirm',
  drawAnimating: false,
  drawStatusText: '正在验证价值保底',
  toast: '',
  toastShow: false,
  loginErr: '',
  loginPhone: '',
  loginSms: '',
  smsLeft: 0,
  payClock: '15:00',
  payUrl: '',
  payQrCode: '',
  payMock: false,
  searchKeyword: '',
  chatAnchor: 'chat-end',
  testResult: false,
  diaryLoading: false,
  refundHint: '',
  profile: false,
  profileNickname: '',
  profileCity: '',
  profileGender: 0,
  orderError: '',
  tripError: '',
  statsError: '',
}

const AVATAR_FILE = 'wechat-avatar.jpg'
const DEFAULT_WX_AVATAR = 'POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcWs4J4g9kTQ'
let avatarSrc = ''
let avatarErrorTried = false

function isHttpsAvatar(url) {
  return typeof url === 'string' && /^https:\/\//.test(url)
}

function isDefaultWechatAvatar(url) {
  return !url || url.indexOf(DEFAULT_WX_AVATAR) >= 0
}

function isUsableAvatar(url) {
  return !!(url && typeof url === 'string' && !isDefaultWechatAvatar(url))
}

function avatarFromEvent(e) {
  if (!e) return ''
  if (typeof e === 'string') return e
  const d = e.detail || e
  if (typeof d === 'string') return d
  if (!d || typeof d !== 'object') return ''
  return d.avatarUrl || d.avatarurl || d.avatarURL || e.avatarUrl || ''
}

function rememberAvatarPath(path) {
  if (!isUsableAvatar(path)) return
  try { wx.setStorageSync('wechatAvatarPath', path) } catch (e) {}
  try {
    const cached = wx.getStorageSync('wechatProfile') || {}
    cached.avatarUrl = path
    wx.setStorageSync('wechatProfile', cached)
  } catch (e) {}
  if (!state.user) state.user = { phone: '', nickname: '', channel: '', wxName: '', avatarUrl: '' }
  state.user.avatarUrl = path
}

function persistAvatarSync(src) {
  if (!isUsableAvatar(src)) return ''
  if (src.indexOf('data:image/') === 0 || isHttpsAvatar(src)) {
    rememberAvatarPath(src)
    return src
  }
  const fs = wx.getFileSystemManager()
  const dest = wx.env.USER_DATA_PATH + '/' + AVATAR_FILE
  try { fs.unlinkSync(dest) } catch (e) {}
  try {
    fs.copyFileSync(src, dest)
    rememberAvatarPath(dest)
    return dest
  } catch (e) {
    try {
      const saved = fs.saveFileSync(src, dest)
      const path = typeof saved === 'string' && saved ? saved : dest
      rememberAvatarPath(path)
      return path
    } catch (e2) {
      rememberAvatarPath(src)
      return src
    }
  }
}

function fileToDisplaySrc(path) {
  return new Promise((resolve) => {
    if (!isUsableAvatar(path)) {
      avatarSrc = ''
      return resolve('')
    }
    if (path.indexOf('data:image/') === 0 || isHttpsAvatar(path)) {
      avatarSrc = path
      return resolve(path)
    }
    wx.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success: (res) => {
        if (!res || !res.data) {
          avatarSrc = path
          return resolve(path)
        }
        const mime = /\.png(\?|$)/i.test(path) ? 'image/png' : 'image/jpeg'
        const dataUrl = 'data:' + mime + ';base64,' + res.data
        avatarSrc = dataUrl.length > 700000 ? path : dataUrl
        resolve(avatarSrc)
      },
      fail: () => {
        avatarSrc = path
        resolve(path)
      },
    })
  })
}

function persistAvatar(src) {
  return new Promise((resolve) => {
    if (!isUsableAvatar(src)) return resolve('')
    const finish = (path) => {
      const used = path || src
      rememberAvatarPath(used)
      avatarSrc = used
      resolve(used)
    }
    if (isHttpsAvatar(src)) {
      wx.downloadFile({
        url: src,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) finish(persistAvatarSync(res.tempFilePath) || src)
          else finish(src)
        },
        fail: () => finish(src),
      })
      return
    }
    finish(persistAvatarSync(src) || src)
  })
}

function keepAvatar(remote) {
  const list = [
    wx.getStorageSync('wechatAvatarPath'),
    state.user && state.user.avatarUrl,
    (wx.getStorageSync('wechatProfile') || {}).avatarUrl,
    remote,
  ]
  for (let i = 0; i < list.length; i++) {
    if (isUsableAvatar(list[i])) return list[i]
  }
  return ''
}

function resolvedAvatar() {
  if (isUsableAvatar(avatarSrc)) return avatarSrc
  return keepAvatar('')
}

function recoverAvatarDisplay() {
  if (avatarErrorTried) return
  avatarErrorTried = true
  const path = keepAvatar('') || avatarSrc
  if (!isUsableAvatar(path) || path.indexOf('data:image/') === 0) return
  fileToDisplaySrc(path).then((src) => {
    if (src) emit()
  })
}

function defaultState() {
  return {
    category: 'nearby',
    mood: 'all',
    trips: [],
    badges: [],
    savedTotal: 0,
    personality: null,
    aiSessions: [],
    aiCurrentId: '',
    aiHistCollapsed: true,
    aiHistFoldTouched: false,
    aiGuestSessionId: '',
    loggedIn: false,
    user: { phone: '', nickname: '', channel: '', wxName: '', avatarUrl: '' },
    orders: [],
    refunds: [],
  }
}

let state = defaultState()
let currentBox = null
let drawnRoute = null
let specialIndex = 1
let testIndex = 0
let testAnswers = []
let testStartedAt = 0
let testSubmitting = false
let currentTripId = null
let aiBusy = false
let aiRendering = false
let currentOrder = null
let loginAfter = null
let orderFilter = 'all'
let stats = null
let refundTargetNo = ''
let refundReason = '未出行退换 · 行程冲突'

function clearUserTransactions() {
  state.orders = []
  state.refunds = []
  state.trips = []
  state.savedTotal = 0
  stats = null
  ui.orderError = ''
  ui.tripError = ''
  ui.statsError = ''
}

function emit() {
  const snap = snapshot()
  listeners.slice().forEach((fn) => {
    try { fn(snap) } catch (e) {}
  })
}

function subscribe(fn) {
  listeners.push(fn)
  fn(snapshot())
  return () => {
    const i = listeners.indexOf(fn)
    if (i >= 0) listeners.splice(i, 1)
  }
}

function saveState() {
  wx.setStorageSync(STORE_KEY, state)
}

function loadState() {
  try {
    const s = wx.getStorageSync(STORE_KEY)
    if (s) state = { ...defaultState(), ...(typeof s === 'string' ? JSON.parse(s) : s) }
  } catch (e) {}
  if (!state.user) state.user = { phone: '', nickname: '', channel: '', wxName: '' }
  if (!Array.isArray(state.orders)) state.orders = []
  if (!Array.isArray(state.refunds)) state.refunds = []
  state.loggedIn = !!wx.getStorageSync('token')
  if (!state.loggedIn) {
    state.orders = []
    state.refunds = []
    state.trips = []
    state.savedTotal = 0
  }
  ensureAiState()
}

function blankAiSession() {
  return {
    id: 'ses_' + Date.now(),
    title: '新对话',
    time: '今天',
    messages: [{ role: 'bot', text: aiConfig.greet || AI_GREET }],
  }
}

function seedAiSessions() { return [blankAiSession()] }

function ensureAiState() {
  let seeded = false
  if (!Array.isArray(state.aiSessions) || !state.aiSessions.length) {
    state.aiSessions = seedAiSessions()
    state.aiCurrentId = state.aiSessions[state.aiSessions.length - 1].id
    seeded = true
  }
  state.aiSessions.forEach((s) => {
    if (!Array.isArray(s.messages) || !s.messages.length) {
      s.messages = [{ role: 'bot', text: aiConfig.greet || AI_GREET }]
    }
    if (!s.title) s.title = '新对话'
  })
  if (!state.aiSessions.some((s) => s.id === state.aiCurrentId)) {
    state.aiCurrentId = state.aiSessions[0].id
  }
  if (!state.aiHistFoldTouched) state.aiHistCollapsed = true
  if (seeded) saveState()
}

function pad2(n) { return String(n).padStart(2, '0') }

function nowStamp() {
  const d = new Date()
  return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
}

function maskPhone(p) {
  const s = String(p || '')
  if (s.length < 7) return s || '未绑定'
  return s.slice(0, 3) + '****' + s.slice(-4)
}

function isLoggedIn() { return !!state.loggedIn }

function validTrips() {
  return (state.trips || []).filter((t) => t.valid !== false)
}

function findBox(id) {
  return boxes.find((b) => String(b.id) === String(id))
}

function splitTitle(name) {
  if (!name) return ''
  if (name.length <= 5) return name
  return name.slice(0, 4) + '\n' + name.slice(4)
}

function syncTabBar() {
  const hidden = anyModal()
  try {
    const pages = getCurrentPages()
    pages.forEach((page) => {
      if (!page || typeof page.getTabBar !== 'function') return
      const bar = page.getTabBar()
      if (bar && typeof bar.setData === 'function') bar.setData({ hidden })
    })
  } catch (e) {}
}

function showDemoToast(msg) {
  ui.toast = msg
  ui.toastShow = true
  toastSeq += 1
  const seq = toastSeq
  emit()
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (seq !== toastSeq) return
    ui.toastShow = false
    emit()
  }, 1800)
}

function persist() {
  saveState()
  emit()
}

function currentAiSession() {
  return state.aiSessions.find((s) => s.id === state.aiCurrentId) || state.aiSessions[0]
}

function flattenMessages(session) {
  const rows = []
  ;(session.messages || []).forEach((m, i) => {
    rows.push({
      key: 'm-' + i,
      kind: 'bubble',
      role: m.role,
      text: m.text,
      markdownNodes: m.role === 'bot' ? markdown.parse(m.text) : [],
    })
    if (m.recIds && m.recIds.length) {
      const recs = m.recIds.map(findBox).filter(Boolean)
      if (recs.length) {
        rows.push({
          key: 'r-' + i,
          kind: 'recs',
          role: 'bot',
          recs,
        })
      }
    }
  })
  if (aiBusy && !aiRendering) {
    rows.push({ key: 'typing', kind: 'typing', role: 'bot' })
  }
  return rows
}

function products() {
  const list = boxes.filter((b) => {
    const catOk = state.category === 'all' || b.category === state.category
    const moodOk = state.mood === 'all' || (b.moods || []).includes(state.mood)
    return catOk && moodOk
  })
  return list.slice(0, 3)
}

function specialItem() {
  return boxes[specialIndex] || boxes[1] || boxes[0]
}

function specialPager() {
  return [0, 1, 2].map((n) => ({
    n,
    lab: String(n + 1).padStart(2, '0'),
    on: n === specialIndex,
  }))
}

function specialDescText(item) {
  if (!item) return ''
  const ratio = Math.round(item.guarantee / item.price * 100)
  return item.desc + '\n票面保底 ' + ratio + '%'
}

function orderStatusLabel(o) {
  if (o.st === 'pending_pay') return { text: '待支付', cls: 'st-wait' }
  if (o.st === 'cancelled') return { text: '已取消', cls: 'st-bad' }
  if (o.st === 'refunded') return { text: '已退款', cls: 'st-bad' }
  if (o.refundSt === 'pending_review') return { text: '退款审核中', cls: 'st-wait' }
  if (o.refundSt === 'rejected') return { text: '退换已驳回', cls: 'st-bad' }
  if (o.refundSt === 'approved' || o.refundSt === 'auto') return { text: '已退款', cls: 'st-bad' }
  if (o.st === 'paid') return { text: '已支付', cls: 'st-ok' }
  return { text: '已开盒', cls: 'st-ok' }
}

function filteredOrders() {
  let list = state.orders || []
  if (orderFilter === 'pending_pay') list = list.filter((o) => o.st === 'pending_pay')
  else if (orderFilter === 'opened') list = list.filter((o) => o.st === 'opened' && o.refundSt !== 'pending_review')
  else if (orderFilter === 'refund') list = list.filter((o) => o.st === 'refunded' || o.refundSt === 'pending_review' || o.refundSt === 'rejected' || o.refundSt === 'approved' || o.refundSt === 'auto')
  return list.map((o) => {
    const st = orderStatusLabel(o)
    return {
      ...o,
      stText: st.text,
      stCls: st.cls,
      showPay: o.st === 'pending_pay',
      showTrip: o.st === 'opened' && o.refundSt !== 'pending_review' && o.refundSt !== 'approved' && o.refundSt !== 'auto',
      routeText: o.route && o.route !== '—' ? o.route : '尚未开盒',
    }
  })
}

function pendingPayCount() {
  return (state.orders || []).filter((o) => o.st === 'pending_pay').length
}

function mineMenu() {
  const pending = pendingPayCount()
  const logged = isLoggedIn()
  const rows = [
    {
      key: 'orders',
      action: 'orders',
      b: '我的订单',
      small: logged ? (pending ? pending + ' 笔待支付 ›' : '全部 / 待支付 / 退款 ›') : '登录后查看 ›',
    },
  ]
  if (logged) {
    rows.push({ key: 'stats', action: 'stats', b: '资产详情', small: '目的地 / 消费 / 日记 ›' })
    rows.push({ key: 'edit', action: 'edit', b: '编辑资料', small: '昵称 / 头像 ›' })
    rows.push({ key: 'trips', action: 'trips', b: '我的行程', small: '已开盒线路与攻略 ›' })
    rows.push({ key: 'checkins', action: 'checkins', b: '我的打卡', small: '照片 / 海报 / 点赞 ›' })
    rows.push({ key: 'collections', action: 'collections', b: '收藏帖子', small: '保存的社区灵感 ›' })
    rows.push({ key: 'achievements', action: 'achievements', b: '行为成就', small: '查看解锁进度 ›' })
  } else {
    rows.push({ key: 'login', action: 'login', b: '登录 / 注册', small: '手机验证码或微信 ›' })
  }
  rows.push({
    key: 'badges',
    action: 'badges',
    b: '徽章图鉴',
    small: logged && stats
      ? stats.badgeUnlocked + ' / ' + stats.badgeTotal + ' ›'
      : '登录后同步 ›',
  })
  if (logged) {
    rows.push({ key: 'logout', action: 'logout', b: '退出登录', small: '重新登录后从后端恢复 ›' })
  }
  return rows
}

function currentTrip() {
  return state.trips.find((x) => x.id === currentTripId) || null
}

function snapshot() {
  const item = specialItem()
  const list = validTrips()
  const logged = isLoggedIn()
  const u = state.user || {}
  const ses = currentAiSession() || { messages: [], title: '新对话' }
  const hist = [...state.aiSessions].reverse()
  const t = currentTrip()
  const questions = personalityQuestions
  const q = questions[testIndex] || questions[0] || { question: '题库加载中', options: [] }
  const testResult = state.personality
    ? state.personality
    : { mark: '', name: '', desc: '', recommend: '' }
  return {
    moods: MOODS,
    categories: CATEGORIES,
    orderTabs: ORDER_TABS,
    refundReasons: REFUND_REASONS,
    mood: state.mood,
    category: state.category,
    products: products(),
    productsEmpty: !products().length,
    contentLoaded,
    contentError,
    special: item,
    specialName: splitTitle(item && item.name),
    specialDesc: specialDescText(item),
    specialPager: specialPager(),
    searchKeyword: ui.searchKeyword,
    loggedIn: logged,
    mineNick: logged ? (u.nickname || '旅行探险家') : '未登录',
    mineAvatar: logged ? resolvedAvatar() : '',
    loginAvatar: resolvedAvatar(),
    minePhone: logged
      ? (u.phone ? maskPhone(u.phone) : ('未绑定手机 · ' + (u.channel || '微信')))
      : '登录后查看行程与订单',
    profileRankText: logged ? (stats && stats.title ? stats.title : '—') : '旅行新手',
    mineBadgeHint: logged && stats ? ('已集 ' + stats.badgeUnlocked + ' / ' + stats.badgeTotal) : '登录后同步徽章',
    statTrips: logged && stats ? String(stats.tripCount) : '—',
    statSaved: logged && stats ? ('¥' + stats.savedTotal) : '¥—',
    statLevel: logged && stats ? ('Lv.' + stats.levelNo) : '—',
    statWelfare: logged && stats ? (stats.welfareKm + ' km') : '—',
    mineMenu: mineMenu(),
    trips: list,
    tripsEmpty: !list.length,
    tripCountDisplay: logged && stats ? (stats.tripCount + ' 次出行') : (logged ? '—' : '登录后查看'),
    badges: badgeCatalog.map((b) => ({
      ...b,
      on: b.unlocked === true,
      status: b.unlocked === true ? '已解锁' : '待探索',
    })),
    badgeProgressDisplay: '已解锁 ' + badgeCatalog.filter((b) => b.unlocked === true).length + ' / ' + (badgeTotal || badgeCatalog.length),
    badgeProgress: (badgeTotal || badgeCatalog.length) ? Math.round(badgeCatalog.filter((b) => b.unlocked === true).length / (badgeTotal || badgeCatalog.length) * 100) : 0,
    banners,
    quizHint: state.personality ? ('你是「' + state.personality.name + '」') : '30 秒测出你的旅行 DNA',
    quizBtn: state.personality ? '再测一次' : '去测试',
    aiHistCollapsed: !!state.aiHistCollapsed,
    aiHistory: hist.map((s) => ({
      id: s.id,
      title: s.title,
      time: s.time || '',
      on: s.id === state.aiCurrentId,
    })),
    chatRows: flattenMessages(ses),
    chatAnchor: ui.chatAnchor,
    aiBusy,
    aiQuickQuestions: aiConfig.quickQuestions || [],
    aiGreet: aiConfig.greet || AI_GREET,
    aiHistExpanded: !state.aiHistCollapsed,
    unboxOpen: ui.unbox,
    testOpen: ui.test,
    tripOpen: ui.trip,
    orderOpen: ui.order,
    loginOpen: ui.login,
    refundOpen: ui.refund,
    unboxStep: ui.unboxStep,
    drawAnimating: ui.drawAnimating,
    drawStatusText: ui.drawStatusText,
    mBoxName: (currentBox && currentBox.name) || (currentOrder && currentOrder.box) || '周边微度假盲盒',
    mBoxImg: (currentBox && currentBox.img) || '',
    mBoxPrice: currentBox ? ('¥' + currentBox.price) : '¥99',
    mBoxGuarantee: currentBox ? ('≥ ¥' + currentBox.guarantee) : '≥ ¥120',
    payOrderNo: currentOrder ? currentOrder.no : '—',
    payAmount: currentOrder ? ('¥' + currentOrder.pay) : '¥0',
    payClock: ui.payClock,
    payUrl: ui.payUrl,
    payQrCode: ui.payQrCode,
    payMock: ui.payMock,
    mResImg: drawnRoute ? drawnRoute.img : '',
    mResName: drawnRoute ? drawnRoute.name : '',
    mResMood: drawnRoute ? ('“' + drawnRoute.moodText + '”') : '',
    mResDest: drawnRoute ? drawnRoute.dest : '',
    mResVal: drawnRoute ? ('¥' + drawnRoute.value) : '',
    testQNum: '第 ' + (testIndex + 1) + ' / ' + questions.length + ' 题',
    testProgress: questions.length ? ((testIndex + 1) / questions.length * 100) : 0,
    testQText: q.question || '',
    testOptions: q.options.map((o, i) => ({ i, text: o.text })),
    testShowResult: ui.test && ui.testResult,
    testResultMark: testResult.mark,
    testResultName: testResult.name,
    testResultDesc: testResult.desc,
    testResultRec: testResult.recommend,
    tdName: t ? t.name : '线路名称',
    tdDest: t ? t.dest : '',
    tdVal: t ? ('¥' + t.val) : '¥0',
    tdPrice: t ? ('¥' + t.price) : '¥0',
    tdHighlight: t ? (t.highlight || t.moodText || '把心情交给这一路就好。') : '',
    tdInclude: t ? (t.includeList && t.includeList.length ? t.includeList.map((i) => '· ' + i).join('\n') : '暂无服务信息') : '',
    hasDiary: !!(t && t.diary),
    diaryText: t && t.diary ? t.diary : '',
    diaryLoading: !!ui.diaryLoading,
    orderFilter,
    orderList: filteredOrders(),
    loginErr: ui.loginErr,
    loginPhone: ui.loginPhone,
    loginSms: ui.loginSms,
    smsBtn: ui.smsLeft > 0 ? (ui.smsLeft + 's') : '获取验证码',
    smsDisabled: ui.smsLeft > 0,
    refundHint: ui.refundHint || '',
    refundReason,
    profileOpen: ui.profile,
    profileNickname: ui.profileNickname,
    profileCity: ui.profileCity,
    profileGenderOptions: [
      { value: 0, label: '不填', active: ui.profileGender === 0 },
      { value: 1, label: '男', active: ui.profileGender === 1 },
      { value: 2, label: '女', active: ui.profileGender === 2 },
    ],
    orderError: ui.orderError,
    tripError: ui.tripError,
    statsError: ui.statsError,
    toast: ui.toast,
    toastShow: ui.toastShow,
    anyModal: anyModal(),
  }
}

ui.testResult = false
ui.diaryLoading = false
ui.refundHint = ''

function anyModal() {
  return ui.unbox || ui.test || ui.trip || ui.order || ui.login || ui.refund || ui.profile
}

function afterUi() {
  syncTabBar()
  emit()
}

function closeAllModals() {
  ui.unbox = false
  ui.test = false
  ui.trip = false
  ui.order = false
  ui.login = false
  ui.refund = false
  ui.profile = false
  clearInterval(payTimer)
  payTimer = null
}

function switchNav(tabKey) {
  if (tabKey === 'badges') {
    wx.navigateTo({ url: '/pages/badges/index' })
    return
  }
  const tab = TABS.find((t) => t.key === tabKey)
  if (!tab) return
  wx.switchTab({ url: tab.path })
}

function setSpecial(i) {
  specialIndex = i
  emit()
}

function openCurrentSpecial() {
  const item = specialItem()
  if (item) openUnboxModal(item.id)
}

function filterCategory(cat) {
  state.category = cat
  emit()
  hydrateRemote({ category: cat === 'all' ? undefined : cat, mood: state.mood === 'all' ? undefined : state.mood })
}

function filterMood(mood) {
  state.mood = mood
  emit()
  if (mood && mood !== 'all') {
    try {
      const api = require('../services/api')
      api.createMoodLog(mood).catch(() => {})
      api.listBoxes({ category: state.category === 'all' ? undefined : state.category, mood }).then((list) => applyRemoteBoxes(list)).catch(() => {})
    } catch (e) {}
  } else {
    hydrateRemote({ category: state.category === 'all' ? undefined : state.category })
  }
}

function handleBanner(item) {
  const banner = item && typeof item === 'object'
    ? item
    : banners.find((b) => String(b.id) === String(item))
  if (!banner) return
  const jumpType = banner.jumpType || banner.jumptype
  const jumpTarget = banner.jumpTarget || banner.jumptarget
  if (jumpType === 'category' && jumpTarget) {
    filterCategory(jumpTarget)
  } else if (jumpType === 'box' && jumpTarget) {
    openUnboxModal('box_' + jumpTarget)
  } else if (jumpType === 'url') {
    showDemoToast('该活动链接暂不可在开发环境打开')
  }
}

function filterCategoryAll() {
  state.category = 'all'
  emit()
}

function openLogin(after) {
  loginAfter = after || null
  ui.loginErr = ''
  ui.login = true
  afterUi()
}

function closeLogin() {
  ui.login = false
  afterUi()
}

function requireLogin(after) {
  if (isLoggedIn()) return true
  openLogin(after)
  return false
}

async function sendDemoSms() {
  const phone = (ui.loginPhone || '').trim()
  if (!/^1\d{10}$/.test(phone)) {
    ui.loginErr = '请输入 11 位手机号'
    emit()
    return
  }
  if (ui.smsLeft > 0) return
  try {
    const api = require('../services/api')
    const ticket = await api.sendSms(phone)
    smsToken = (ticket && ticket.smsToken) || ''
    showDemoToast('验证码 ' + DEMO_SMS)
    ui.loginErr = '演示验证码 ' + DEMO_SMS
    ui.smsLeft = 60
    emit()
  } catch (e) {
    ui.loginErr = '验证码发送失败，请稍后重试'
    emit()
    return
  }
  clearInterval(smsTick)
  smsTick = setInterval(() => {
    ui.smsLeft -= 1
    if (ui.smsLeft <= 0) {
      clearInterval(smsTick)
      smsTick = null
      ui.smsLeft = 0
    }
    emit()
  }, 1000)
}

function finishLogin(user) {
  clearUserTransactions()
  state.loggedIn = true
  state.user = user
  saveState()
  hydrateTransactions()
  closeLogin()
  const a = loginAfter
  loginAfter = null
  if (a && a.type === 'unbox') openUnboxModal(a.boxId)
  else if (a && a.type === 'orders') openOrderSheet()
  else if (a && a.type === 'trips') switchNav('trips')
  else if (a && a.type === 'pay') openPayForOrder(a.no)
}

async function submitPhoneLogin() {
  const phone = (ui.loginPhone || '').trim()
  const sms = (ui.loginSms || '').trim()
  if (!/^1\d{10}$/.test(phone)) {
    ui.loginErr = '请输入 11 位手机号'
    emit()
    return
  }
  if (sms !== DEMO_SMS) {
    ui.loginErr = '验证码不正确，演示请填 123456'
    emit()
    return
  }
  try {
    const api = require('../services/api')
    const result = await api.loginPhone(phone, sms, smsToken)
    wx.setStorageSync('token', result.token)
    wx.setStorageSync('user', result.user)
    finishLogin({
      phone: result.user.phone || phone,
      nickname: result.user.nickname || ('途友' + phone.slice(-4)),
      wxName: '',
      avatarUrl: result.user.avatarUrl || '',
      gender: result.user.gender == null ? 0 : result.user.gender,
      city: result.user.city || '',
      channel: '手机',
    })
  } catch (e) {
    ui.loginErr = '登录失败，请先获取验证码'
    emit()
  }
}

async function submitWxLogin(chosenAvatar) {
  if (wxLoginBusy) return false
  wxLoginBusy = true
  try {
    const api = require('../services/api')
    const picked = avatarFromEvent(chosenAvatar)
    let info = wx.getStorageSync('wechatProfile') || {}
    if (picked) {
      avatarErrorTried = false
      const saved = await persistAvatar(picked)
      info.avatarUrl = saved || picked
      avatarSrc = info.avatarUrl
      rememberAvatarPath(info.avatarUrl)
      wx.setStorageSync('wechatProfile', info)
    } else if (isUsableAvatar(info.avatarUrl)) {
      info.avatarUrl = await persistAvatar(info.avatarUrl) || info.avatarUrl
    } else {
      const local = keepAvatar('')
      if (local) info.avatarUrl = local
    }

    const wxResult = await new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }))
    const result = await api.loginWechat({
      code: wxResult.code,
      nickname: info.nickName || '',
      avatarUrl: isHttpsAvatar(info.avatarUrl) && !isDefaultWechatAvatar(info.avatarUrl) ? info.avatarUrl : '',
      gender: info.gender || 0,
      city: info.city || '',
    })
    const avatarUrl = keepAvatar((result.user && result.user.avatarUrl) || info.avatarUrl)
    wx.setStorageSync('token', result.token)
    wx.setStorageSync('user', Object.assign({}, result.user, { avatarUrl }))
    finishLogin({
      phone: result.user.phone || '',
      nickname: result.user.nickname || info.nickName || '微信途友',
      wxName: result.user.nickname || info.nickName || '',
      avatarUrl,
      gender: result.user.gender == null ? (info.gender || 0) : result.user.gender,
      city: result.user.city || info.city || '',
      channel: '微信',
    })
    return true
  } catch (e) {
    ui.loginErr = (e && e.message) || '微信登录失败，请稍后重试'
    emit()
    return false
  } finally {
    wxLoginBusy = false
  }
}

function logoutUser() {
  state.loggedIn = false
  clearUserTransactions()
  state.personality = null
  state.aiSessions = [blankAiSession()]
  state.aiCurrentId = state.aiSessions[0].id
  state.aiGuestSessionId = ''
  wx.removeStorageSync('token')
  wx.removeStorageSync('user')
  saveState()
  hydrateRemote()
  showDemoToast('已退出，再次登录后从后端恢复数据')
}

async function applyChosenAvatar(src) {
  const picked = avatarFromEvent(src)
  if (!picked) return
  avatarErrorTried = false
  const path = await persistAvatar(picked)
  rememberAvatarPath(path || picked)
  avatarSrc = path || picked
  saveState()
  emit()
}

function tickPayClock() {
  if (!currentOrder || currentOrder.st !== 'pending_pay') {
    clearInterval(payTimer)
    payTimer = null
    return
  }
  const left = Math.max(0, (currentOrder.expireAt || 0) - Date.now())
  if (left <= 0) {
    ui.payClock = '00:00'
    clearInterval(payTimer)
    payTimer = null
    emit()
    refreshExpiredOrder()
    return
  }
  const m = Math.floor(left / 60000)
  const s = Math.floor((left % 60000) / 1000)
  ui.payClock = pad2(m) + ':' + pad2(s)
  emit()
}

async function refreshExpiredOrder() {
  if (!currentOrder) return
  try {
    const api = require('../services/api')
    const result = await api.getOrder(currentOrder.no)
    currentOrder = mapRemoteOrder(result)
    const index = state.orders.findIndex((order) => order.no === currentOrder.no)
    if (index >= 0) state.orders[index] = currentOrder
    saveState()
    if (currentOrder.st === 'cancelled') {
      showDemoToast('订单已超时取消')
      closeModal()
      return
    }
    ui.orderError = '订单状态尚未更新，请稍后重试'
    emit()
  } catch (e) {
    ui.orderError = '订单状态查询失败，请稍后重试'
    showDemoToast(ui.orderError)
    emit()
  }
}

function showPayStep(order) {
  currentOrder = order
  currentBox = findBox(order.boxId) || currentBox
  ui.payUrl = order.payUrl || ''
  ui.payQrCode = order.payQrCode || ''
  ui.payMock = order.payMock === true
  ui.unboxStep = 'pay'
  ui.unbox = true
  tickPayClock()
  clearInterval(payTimer)
  payTimer = setInterval(tickPayClock, 1000)
  afterUi()
}

async function goCheckout() {
  if (!currentBox) return
  if (!requireLogin({ type: 'unbox', boxId: currentBox.id })) return
  const pending = (state.orders || []).find((o) => o.st === 'pending_pay' && o.boxId === currentBox.id)
  if (pending) {
    showDemoToast('你有一笔待支付订单')
    showPayStep(pending)
    return
  }
  try {
    const api = require('../services/api')
    const item = await api.createOrder(numericId(currentBox.id))
    const order = mapRemoteOrder(item)
    state.orders = [order, ...state.orders.filter((item) => item.no !== order.no)]
    saveState()
    showPayStep(order)
  } catch (e) {
    showDemoToast('创建订单失败，请稍后重试')
  }
}

function openPayForOrder(no) {
  const order = (state.orders || []).find((o) => o.no === no)
  if (!order || order.st !== 'pending_pay') return
  currentBox = findBox(order.boxId)
  showPayStep(order)
}

async function cancelCurrentOrder() {
  if (!currentOrder || currentOrder.st !== 'pending_pay') return
  try {
    const api = require('../services/api')
    await api.cancelOrder(currentOrder.no)
    currentOrder.st = 'cancelled'
  } catch (e) {
    showDemoToast('取消订单失败')
    return
  }
  saveState()
  clearInterval(payTimer)
  payTimer = null
  closeModal()
  showDemoToast('订单已取消')
}

async function confirmSandboxPay() {
  if (!currentOrder || currentOrder.st !== 'pending_pay') return
  try {
    const api = require('../services/api')
    const payment = await api.payOrder(currentOrder.no)
    currentOrder = { ...currentOrder, payUrl: payment && payment.payUrl, payQrCode: payment && (payment.qrCodeBase64 || payment.qrCodeUrl), payMock: payment && payment.mock === true }
    const index = state.orders.findIndex((order) => order.no === currentOrder.no)
    if (index >= 0) state.orders[index] = currentOrder
    saveState()
    if (currentOrder.payMock) {
      await refreshPaidOrder()
    } else {
      ui.payUrl = currentOrder.payUrl || ''
      ui.payQrCode = currentOrder.payQrCode || ''
      ui.payMock = false
      emit()
      startPaymentPolling()
    }
  } catch (e) {
    showDemoToast('无法创建支付宝订单，请稍后重试')
  }
}

async function refreshPaidOrder() {
  const api = require('../services/api')
  const result = await api.getOrder(currentOrder.no)
  currentOrder = mapRemoteOrder(result)
  const index = state.orders.findIndex((order) => order.no === currentOrder.no)
  if (index >= 0) state.orders[index] = currentOrder
  saveState()
  if (currentOrder.st === 'opened') {
    clearInterval(payTimer)
    payTimer = null
    drawnRoute = { name: currentOrder.route, dest: currentOrder.dest, value: currentOrder.val || currentOrder.pay, moodText: currentOrder.moodText || '', img: currentBox ? currentBox.img : '' }
    hydrateTransactions()
    runRemoteUnboxResult()
  } else if (currentOrder.st === 'refunded' || currentOrder.st === 'cancelled') {
    clearInterval(payTimer)
    payTimer = null
    showDemoToast(currentOrder.st === 'refunded' ? '线路暂时不足，订单已原路退款' : '订单已取消')
    closeModal()
  } else {
    emit()
  }
}

function startPaymentPolling() {
  clearInterval(payTimer)
  payTimer = setInterval(() => {
    refreshPaidOrder().catch(() => {})
  }, 1800)
  refreshPaidOrder().catch(() => {})
}

function runRemoteUnboxResult() {
  ui.unboxStep = 'drawing'
  ui.drawAnimating = true
  ui.drawStatusText = '正在验证价值保底'
  ui.unbox = true
  afterUi()
  const statuses = ['正在验证价值保底', '正在摇匀候选目的地', '正在匹配你的主题线路', '路线卡即将揭晓']
  let statusIndex = 0
  clearInterval(drawStatusTimer)
  drawStatusTimer = setInterval(() => {
    statusIndex = Math.min(statusIndex + 1, statuses.length - 1)
    ui.drawStatusText = statuses[statusIndex]
    afterUi()
  }, 620)
  clearTimeout(drawTimer)
  drawTimer = setTimeout(() => {
    clearInterval(drawStatusTimer)
    ui.drawAnimating = false
    ui.unboxStep = 'result'
    afterUi()
  }, 2300)
}

function openUnboxModal(boxId) {
  if (!requireLogin({ type: 'unbox', boxId })) return
  currentBox = findBox(boxId) || boxes[0]
  ui.unboxStep = 'confirm'
  ui.unbox = true
  afterUi()
}

function closeModal() {
  clearInterval(payTimer)
  payTimer = null
  clearInterval(drawStatusTimer)
  clearTimeout(drawTimer)
  ui.drawAnimating = false
  ui.unbox = false
  afterUi()
}

function acceptRouteResult() {
  closeModal()
  switchNav('trips')
}

async function openTripDetail(id) {
  const t = state.trips.find((x) => x.id === id)
  if (!t) return
  try {
    const api = require('../services/api')
    const remote = await api.getTrip(id)
    const mapped = mapRemoteTrip(remote)
    const index = state.trips.findIndex((item) => item.id === id)
    if (index >= 0) state.trips[index] = mapped
  } catch (e) {}
  currentTripId = id
  ui.diaryLoading = false
  ui.trip = true
  afterUi()
}

function closeTripDetail() {
  ui.trip = false
  afterUi()
}

async function generateDiary() {
  const t = state.trips.find((x) => x.id === currentTripId)
  if (!t) return
  ui.diaryLoading = true
  emit()
  try {
    const api = require('../services/api')
    const result = await api.generateDiary(t.id)
    t.diary = result && result.diaryText ? result.diaryText : ''
    ui.diaryLoading = false
    saveState()
    emit()
  } catch (e) {
    ui.diaryLoading = false
    showDemoToast('日记生成失败')
  }
}

async function startPersonalityTest() {
  testIndex = 0
  testAnswers = []
  testStartedAt = Date.now()
  testSubmitting = false
  ui.testResult = false
  ui.test = true
  afterUi()
  try {
    const api = require('../services/api')
    const questions = await api.listPersonalityQuestions()
    personalityQuestions = (questions || []).map((question) => ({
      id: question.id,
      question: question.question,
      options: (question.options || []).map((option) => ({ id: option.id, text: option.text })),
    }))
    if (!personalityQuestions.length) {
      ui.test = false
      showDemoToast('人格题库暂未开放')
    }
    emit()
  } catch (e) {
    personalityQuestions = []
    ui.test = false
    showDemoToast('人格题库加载失败')
  }
}

function closeTestModal() {
  ui.test = false
  afterUi()
}

async function selectTestOption(i) {
  if (testSubmitting || !personalityQuestions[testIndex] || !personalityQuestions[testIndex].options[i]) return
  testAnswers[testIndex] = i
  if (testIndex < personalityQuestions.length - 1) {
    testIndex += 1
    emit()
    return
  }
  testSubmitting = true
  try {
    const api = require('../services/api')
    const result = await api.submitPersonality({
      answers: testAnswers,
      durationMs: Math.max(0, Date.now() - testStartedAt),
    })
    state.personality = {
      type: result.type,
      name: result.name,
      mark: result.mark,
      desc: result.description,
      recommend: result.recommend,
    }
    saveState()
    ui.testResult = true
    emit()
  } catch (e) {
    showDemoToast('人格结果提交失败，请重试')
  } finally {
    testSubmitting = false
  }
}

function finishPersonalityToHome() {
  closeTestModal()
  switchNav('home')
}

function openOrderSheet() {
  if (!requireLogin({ type: 'orders' })) return
  ui.order = true
  afterUi()
  try {
    const api = require('../services/api')
    api.listOrders().then((result) => applyRemoteOrders(result)).catch(() => {
      state.orders = []
      ui.orderError = '订单加载失败，请重试'
      saveState()
      emit()
    })
  } catch (e) {
    state.orders = []
    ui.orderError = '订单加载失败，请重试'
    saveState()
    emit()
  }
}

function setOrderFilter(v) {
  orderFilter = v
  openOrderSheet()
}

function closeOrderSheet() {
  ui.order = false
  afterUi()
}

async function cancelOrderByNo(no) {
  const o = state.orders.find((x) => x.no === no)
  if (!o || o.st !== 'pending_pay') return
  try {
    const api = require('../services/api')
    await api.cancelOrder(no)
    o.st = 'cancelled'
  } catch (e) {
    showDemoToast('取消订单失败')
    return
  }
  saveState()
  emit()
  showDemoToast('订单已取消')
}

function viewOrderTrip(no) {
  const o = state.orders.find((x) => x.no === no)
  closeOrderSheet()
  switchNav('trips')
  if (o && o.tripId) {
    setTimeout(() => openTripDetail(o.tripId), 80)
  }
}

function continuePay(no) {
  closeOrderSheet()
  openPayForOrder(no)
}

function openRefundModal(no) {
  const o = state.orders.find((x) => x.no === no)
  if (!o) return
  refundTargetNo = no
  refundReason = '未出行退换 · 行程冲突'
  ui.refundHint = o.no + ' · ' + o.box + ' · ¥' + o.pay
  ui.refund = true
  afterUi()
}

function closeRefundModal() {
  ui.refund = false
  afterUi()
}

function pickRefundReason(reason) {
  refundReason = reason
  emit()
}

async function submitRefund() {
  const o = state.orders.find((x) => x.no === refundTargetNo)
  if (!o || o.st !== 'opened') return
  try {
    const api = require('../services/api')
    const kind = refundReason.indexOf('保底') >= 0 ? 'value_guard' : 'unused'
    await api.refundOrder(o.no, refundReason, kind)
  } catch (e) {
    showDemoToast('退款申请失败')
    return
  }
  o.refundSt = 'pending_review'
  hydrateTransactions()
  saveState()
  closeRefundModal()
  orderFilter = 'refund'
  openOrderSheet()
  showDemoToast('已提交，请到管理端审核')
}

function toggleAiHistory() {
  state.aiHistCollapsed = !state.aiHistCollapsed
  state.aiHistFoldTouched = true
  saveState()
  emit()
}

function onAiHistRailClick() {
  if (!state.aiHistCollapsed) return
  toggleAiHistory()
}

function openAiChat(id) {
  state.aiCurrentId = id
  saveState()
  emit()
}

function newAiChat() {
  if (state.loggedIn) {
    showDemoToast('当前账号保留一个连续对话')
    return
  }
  const empty = state.aiSessions.find((s) => s.title === '新对话' && s.messages.length <= 1)
  if (empty) {
    openAiChat(empty.id)
    return
  }
  const ses = blankAiSession()
  state.aiSessions.push(ses)
  state.aiCurrentId = ses.id
  saveState()
  emit()
}

function persistAiMessage(role, text, recIds, sid) {
  const ses = state.aiSessions.find((s) => s.id === (sid || state.aiCurrentId)) || currentAiSession()
  const msg = { role, text }
  if (recIds && recIds.length) msg.recIds = recIds
  ses.messages.push(msg)
  if (role === 'user' && (ses.title === '新对话' || ses.messages.filter((m) => m.role === 'user').length === 1)) {
    ses.title = text.slice(0, 12)
  }
  ses.time = '刚刚'
  saveState()
  return msg
}

function typeAiMessage(text, recIds, sid) {
  const content = String(text || '')
  const msg = persistAiMessage('bot', '', null, sid)
  if (!content) return Promise.resolve()
  aiRendering = true
  const step = Math.max(1, Math.ceil(content.length / 60))
  let offset = 0
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      offset = Math.min(content.length, offset + step)
      msg.text = content.slice(0, offset)
      ui.chatAnchor = 'chat-end'
      emit()
      if (offset >= content.length) {
        clearInterval(timer)
        aiRendering = false
        if (recIds && recIds.length) msg.recIds = recIds
        saveState()
        emit()
        resolve()
      }
    }, 20)
  })
}

async function sendUserMessage(text, viaQuick) {
  if (aiBusy || !text) return
  const sid = state.aiCurrentId
  aiBusy = true
  persistAiMessage('user', text, null, sid)
  emit()
  try {
    const api = require('../services/api')
    const reply = await api.aiChat({
      text,
      viaQuick: viaQuick === true,
      sessionId: state.loggedIn ? undefined : (state.aiGuestSessionId || undefined),
    })
    if (!state.loggedIn && reply.sessionId) state.aiGuestSessionId = reply.sessionId
    const ids = (reply.recommendBoxes || []).map((box) => 'box_' + box.id)
    await typeAiMessage(reply.content, ids, sid)
    if (reply.fallback) showDemoToast('小途已切换到本地旅行建议')
  } catch (e) {
    persistAiMessage('bot', '消息没有送达，请稍后再试。', null, sid)
  } finally {
    aiRendering = false
    aiBusy = false
    ui.chatAnchor = 'chat-end'
    emit()
  }
}

function sendQuickPrompt(t) {
  sendUserMessage(t, true)
}

async function hydrateAi() {
  try {
    const api = require('../services/api')
    const config = await api.aiConfig()
    aiConfig = {
      greet: (config && config.greet) || AI_GREET,
      quickQuestions: (config && config.quickQuestions) || [],
    }
    if (state.loggedIn) {
      const history = await api.aiMessages({ limit: 16 })
      const session = {
        id: 'server_user',
        title: '最近对话',
        time: '已同步',
        messages: [{ role: 'bot', text: aiConfig.greet }].concat((history || []).map((message) => ({
          role: message.role === 'assistant' ? 'bot' : 'user',
          text: message.content,
          fallback: message.fallback === true,
        }))),
      }
      state.aiSessions = [session]
      state.aiCurrentId = session.id
    } else if (state.aiSessions.length === 1 && state.aiSessions[0].messages.length <= 1) {
      state.aiSessions[0].messages = [{ role: 'bot', text: aiConfig.greet }]
    }
    saveState()
    emit()
  } catch (e) {
    if (!state.aiSessions.length) ensureAiState()
    emit()
  }
}

function onMineMenu(action) {
  if (action === 'orders') openOrderSheet()
  else if (action === 'login') openLogin({ type: 'mine' })
  else if (action === 'stats') wx.navigateTo({ url: '/pages/mine/stats-detail' })
  else if (action === 'edit') openProfileEditor()
  else if (action === 'badges') switchNav('badges')
  else if (action === 'trips') wx.switchTab({ url: '/pages/trips/index' })
  else if (action === 'checkins') wx.navigateTo({ url: '/pages/checkin/index' })
  else if (action === 'collections') wx.navigateTo({ url: '/pages/community/collections' })
  else if (action === 'achievements') wx.navigateTo({ url: '/pages/achievements/index' })
  else if (action === 'logout') logoutUser()
}

function openProfileEditor() {
  if (!isLoggedIn()) {
    openLogin({ type: 'mine' })
    return
  }
  const user = state.user || {}
  ui.profileNickname = user.nickname || ''
  ui.profileCity = user.city || ''
  ui.profileGender = Number(user.gender || 0)
  ui.profile = true
  afterUi()
}

function closeProfileEditor() {
  ui.profile = false
  afterUi()
}

function setProfileNickname(value) {
  ui.profileNickname = String(value || '')
  emit()
}

function setProfileCity(value) {
  ui.profileCity = String(value || '')
  emit()
}

function setProfileGender(value) {
  ui.profileGender = Number(value || 0)
  emit()
}

async function submitProfile() {
  const nickname = (ui.profileNickname || '').trim()
  const city = (ui.profileCity || '').trim()
  if (!nickname) {
    showDemoToast('请填写昵称')
    return
  }
  if (nickname.length > 30 || city.length > 30) {
    showDemoToast('资料长度超出限制')
    return
  }
  try {
    const api = require('../services/api')
    const avatar = resolvedAvatar()
    const user = await api.updateMe({
      nickname,
      city,
      gender: ui.profileGender,
      avatarUrl: isHttpsAvatar(avatar) ? avatar : undefined,
    })
    state.user = {
      ...state.user,
      ...user,
      nickname: user.nickname || nickname,
      city: user.city || city,
      gender: user.gender == null ? ui.profileGender : user.gender,
      avatarUrl: keepAvatar(user.avatarUrl || avatar),
    }
    saveState()
    ui.profile = false
    showDemoToast('资料已保存')
    emit()
  } catch (e) {
    showDemoToast((e && e.message) || '资料保存失败')
  }
}

function applyRemoteBoxes(list) {
  if (!Array.isArray(list)) return
  boxes = list.map((item, i) => ({
    id: 'box_' + (item.id != null ? item.id : i),
    rank: item.rankTag || item.tag || '',
    name: item.name || '',
    category: item.category || 'nearby',
    desc: item.intro || '',
    price: Number(item.price || 0),
    guarantee: Number(item.minValue || 0),
    moods: Array.isArray(item.moods) ? item.moods : [],
    img: item.coverUrl || '',
  }))
  if (specialIndex >= boxes.length) specialIndex = Math.max(0, Math.min(1, boxes.length - 1))
  contentLoaded = true
  contentError = ''
  emit()
}

function applyRemoteBadges(result) {
  const list = result && Array.isArray(result.list) ? result.list : result
  if (!Array.isArray(list)) return
  if (result && typeof result.total === 'number') badgeTotal = result.total
  badgeCatalog = list.map((item) => ({
    name: item.name || '',
    mark: item.mark || (item.name ? item.name.slice(0, 1) : ''),
    unlocked: item.unlocked === true,
    unlockedAt: item.unlockedAt || null,
  }))
  if (!badgeTotal) badgeTotal = badgeCatalog.length
  emit()
}

function applyRemoteBanners(list) {
  if (!Array.isArray(list)) return
  banners = list.map((item) => ({
    id: item.id,
    title: item.title || '',
    subTitle: item.subTitle || '',
    tag: item.tag || '',
    imageUrl: item.imageUrl || '',
    jumpType: item.jumpType || 'none',
    jumpTarget: item.jumpTarget || null,
  }))
  emit()
}

function numericId(value) {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : Number(value)
}

function mapRemoteOrder(item) {
  const existing = (state.orders || []).find((order) => order.no === item.orderNo) || {}
  return {
    ...existing,
    no: item.orderNo,
    user: state.user.nickname || '途友',
    phone: state.user.phone ? maskPhone(state.user.phone) : '未绑定',
    box: item.boxName,
    boxId: 'box_' + item.boxId,
    pay: Number(item.priceCent || 0) / 100,
    ch: item.payChannel === 'mock' ? '支付宝沙箱' : (item.payChannel || '支付宝沙箱'),
    st: item.status,
    refundSt: item.refundStatus || existing.refundSt || '',
    refundKind: item.refundKind || '',
    refundRejectReason: item.refundRejectReason || '',
    route: item.routeName || '—',
    dest: item.location || '',
    val: item.routeValueCent ? Number(item.routeValueCent) / 100 : (existing.val || 0),
    moodText: item.moodText || existing.moodText || '',
    tripId: item.tripId || '',
    time: item.createdAt || existing.time || nowStamp(),
    expireAt: item.expireAt ? new Date(item.expireAt).getTime() : existing.expireAt,
    payUrl: item.payUrl || existing.payUrl || '',
    payQrCode: item.qrCodeBase64 || item.qrCodeUrl || existing.payQrCode || '',
    payMock: item.mock === true || existing.payMock === true,
  }
}

function applyRemoteOrders(result) {
  const list = result && Array.isArray(result.list) ? result.list : result
  if (!Array.isArray(list)) return
  state.orders = list.map(mapRemoteOrder)
  ui.orderError = ''
  saveState()
  emit()
}

function mapRemoteTrip(item) {
  return {
    id: item.id,
    orderId: item.orderId || '',
    boxId: item.boxId,
    valid: item.validity !== 'invalid',
    boxName: item.boxName,
    name: item.routeName,
    dest: item.location,
    val: Number(item.valueCent || 0) / 100,
    price: Number(item.priceCent || 0) / 100,
    img: findBox('box_' + item.boxId)?.img || '',
    date: item.openedDate || '',
    highlight: item.highlight || '',
    includeList: Array.isArray(item.includeList) ? item.includeList : [],
    badgeName: item.badgeName || '',
    moodText: item.moodText || '',
    category: item.boxCategory,
    diary: item.diaryText || '',
  }
}

function applyRemoteTrips(result) {
  const list = result && Array.isArray(result.list) ? result.list : result
  if (!Array.isArray(list)) return
  state.trips = list.map(mapRemoteTrip)
  state.savedTotal = state.trips.reduce((sum, trip) => sum + Math.max(0, trip.val - trip.price), 0)
  ui.tripError = ''
  saveState()
  emit()
}

function hydrateTransactions() {
  try {
    const api = require('../services/api')
    api.me().then((user) => {
      const cachedProfile = wx.getStorageSync('wechatProfile') || {}
      state.user = {
        phone: user.phone || '',
        nickname: user.nickname || '途友',
        wxName: user.nickname || '',
        channel: user.registerChannel === 'wechat' ? '微信' : '手机',
        avatarUrl: keepAvatar(user.avatarUrl || cachedProfile.avatarUrl),
        gender: user.gender == null ? 0 : user.gender,
        city: user.city || '',
      }
      state.loggedIn = true
      saveState()
      emit()
    }).catch((err) => {
      const msg = String((err && err.message) || '')
      if (!wx.getStorageSync('token') || msg.indexOf('未登录') >= 0 || msg.indexOf('禁用') >= 0) {
        wx.removeStorageSync('token')
        state.loggedIn = false
        clearUserTransactions()
        hydrateRemote()
        saveState()
        emit()
      }
    })
    api.meStats().then((result) => {
      stats = result || null
      ui.statsError = ''
      emit()
    }).catch(() => {
      stats = null
      ui.statsError = '个人数据加载失败，请重试'
      emit()
    })
    api.myPersonality().then((result) => {
      if (!result) return
      state.personality = {
        type: result.type,
        name: result.name,
        mark: result.mark,
        desc: result.description,
        recommend: result.recommend,
      }
      saveState()
      emit()
    }).catch(() => {})
    api.listTrips().then((result) => applyRemoteTrips(result)).catch(() => {
      state.trips = []
      state.savedTotal = 0
      ui.tripError = '行程加载失败，请重试'
      saveState()
      emit()
    })
    api.listOrders().then((result) => applyRemoteOrders(result)).catch(() => {
      state.orders = []
      ui.orderError = '订单加载失败，请重试'
      saveState()
      emit()
    })
    api.listBadges().then((result) => applyRemoteBadges(result)).catch(() => {
      badgeCatalog = []
      badgeTotal = 0
      emit()
    })
  } catch (e) {}
}

function hydrateRemote(params) {
  try {
    const api = require('../services/api')
    api.listBoxes(params)
      .then((list) => applyRemoteBoxes(list))
      .catch(() => {
        boxes = []
        contentLoaded = true
        contentError = '盲盒加载失败，请下拉重试'
        emit()
      })
    api.listBadges()
      .then((list) => applyRemoteBadges(list))
      .catch(() => {
        badgeCatalog = []
        badgeTotal = 0
        emit()
      })
    api.listBanners()
      .then((list) => applyRemoteBanners(list))
      .catch(() => {
        banners = []
        emit()
      })
    if (state.loggedIn) {
      api.listTrips().then((result) => applyRemoteTrips(result)).catch(() => {
        state.trips = []
        state.savedTotal = 0
        ui.tripError = '行程加载失败，请重试'
        saveState()
        emit()
      })
      api.listOrders().then((result) => applyRemoteOrders(result)).catch(() => {
        state.orders = []
        ui.orderError = '订单加载失败，请重试'
        saveState()
        emit()
      })
    }
  } catch (e) {
    contentLoaded = true
    contentError = '内容加载失败，请稍后重试'
  }
}

function init() {
  try {
    const cached = wx.getStorageSync('wechatProfile') || {}
    if (cached.avatarUrl && isDefaultWechatAvatar(cached.avatarUrl)) {
      cached.avatarUrl = ''
      wx.setStorageSync('wechatProfile', cached)
    }
  } catch (e) {}
  loadState()
  const savedAvatar = keepAvatar('')
  if (savedAvatar) avatarSrc = savedAvatar
  hydrateRemote()
  if (state.loggedIn) hydrateTransactions()
  hydrateAi()
  emit()
}

function copyPayUrl() {
  if (!ui.payUrl) return
  wx.setClipboardData({
    data: ui.payUrl,
    success: () => showDemoToast('支付链接已复制，请在外部浏览器打开'),
  })
}

function resumePaymentPolling() {
  if (currentOrder && currentOrder.st === 'pending_pay' && currentOrder.payUrl && ui.unbox) startPaymentPolling()
}

function setLoginPhone(v) { ui.loginPhone = v }
function setLoginSms(v) { ui.loginSms = v }

function goHomeFromEmpty() { switchNav('home') }

module.exports = {
  TABS,
  init,
  subscribe,
  snapshot,
  setSpecial,
  openCurrentSpecial,
  filterCategory,
  filterMood,
  handleBanner,
  filterCategoryAll,
  openUnboxModal,
  closeModal,
  goCheckout,
  confirmSandboxPay,
  copyPayUrl,
  resumePaymentPolling,
  cancelCurrentOrder,
  acceptRouteResult,
  openTripDetail,
  closeTripDetail,
  generateDiary,
  startPersonalityTest,
  closeTestModal,
  selectTestOption,
  finishPersonalityToHome,
  openOrderSheet,
  setOrderFilter,
  closeOrderSheet,
  cancelOrderByNo,
  viewOrderTrip,
  continuePay,
  openRefundModal,
  closeRefundModal,
  pickRefundReason,
  submitRefund,
  openLogin,
  closeLogin,
  sendDemoSms,
  submitPhoneLogin,
  submitWxLogin,
  logoutUser,
  applyChosenAvatar,
  openProfileEditor,
  closeProfileEditor,
  setProfileNickname,
  setProfileCity,
  setProfileGender,
  submitProfile,
  recoverAvatarDisplay,
  toggleAiHistory,
  onAiHistRailClick,
  openAiChat,
  newAiChat,
  sendUserMessage,
  sendQuickPrompt,
  hydrateAi,
  onMineMenu,
  setLoginPhone,
  setLoginSms,
  goHomeFromEmpty,
  switchNav,
  showDemoToast,
  requireLogin,
}
