const data = require('./tuge-data')
const markdown = require('./markdown')
const { resolveMedia, fetchDisplayMedia, cachedMediaPath } = require('./request')
const push = require('./push')
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
  { key: 'message', path: '/pages/message/index', text: '消息' },
  { key: 'community', path: '/pages/community/index', text: '社区' },
  { key: 'trips', path: '/pages/trips/index', text: '行程' },
  { key: 'mine', path: '/pages/mine/index', text: '我的' },
]

// 心情开箱：选心情 → 推送匹配盲盒 → 一键开箱（复用 GET /boxes?mood 与 POST /mood-logs）
const MOOD_PICKS = [
  { key: 'happy', emoji: '😄', label: '开心', line: '心情正好，趁兴出发' },
  { key: 'emo', emoji: '😮‍💨', label: 'emo', line: '有点丧？交给山野治愈' },
  { key: 'bored', emoji: '🥱', label: '无聊', line: '无聊预警，来点新鲜感' },
  { key: 'curious', emoji: '🌫️', label: '迷茫', line: '有些迷茫？让旅途给答案' },
]

let boxes = []
let searchResults = []
let badgeCatalog = []
let badgeTotal = 0
let banners = []
let personalityQuestions = []
let aiConfig = { greet: AI_GREET, quickQuestions: [] }
let contentLoaded = false
let contentError = ''
let moodPool = []
let moodPick = ''
let moodPickIndex = 0
let moodPickLoading = false

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
let msgBadge = 0
let msgBadgeSeq = 0
let bannerTimer = null
let bannerSeq = 0
let homeCacheTried = false

const ui = {
  unbox: false,
  test: false,
  trip: false,
  order: false,
  login: false,
  refund: false,
  unboxStep: 'confirm',
  drawAnimating: false,
  drawStatusText: '正在验证订单信息',
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
  searchActive: false,
  searching: false,
  chatAnchor: 'chat-end',
  banner: null,
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
  // 社区头像需要在服务器间共享：接受 http(s) 绝对地址（本地环境为 http）
  return typeof url === 'string' && /^https?:\/\//.test(url)
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

let avatarLocalizing = false
function resolvedAvatar() {
  if (isUsableAvatar(avatarSrc)) return avatarSrc
  const pick = keepAvatar('')
  // 只剩远程 http 头像时（本地副本失效/未生成）：优先用媒体持久缓存里的本地文件，
  // 没有则后台下载落地后回填，避免真机明文 http 头像空白
  if (pick && /^http:/i.test(pick) && !avatarLocalizing) {
    const local = cachedMediaPath(pick)
    if (local) return local
    avatarLocalizing = true
    fetchDisplayMedia(pick).then((localPath) => {
      avatarLocalizing = false
      if (localPath && localPath !== pick) { avatarSrc = localPath; emit() }
    }).catch(() => { avatarLocalizing = false })
  }
  return pick
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
  if (!MOODS.some((item) => item.key === state.mood)) state.mood = 'all'
  if (state.category !== 'all' && !CATEGORIES.some((item) => item.key === state.category)) {
    state.category = 'nearby'
  }
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
  return item.desc
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
  return [
    { key: 'trips', group: 'journey', action: 'trips', b: '我的行程', small: logged ? ((stats ? stats.tripCount : 0) + ' 次出行 ›') : '登录后查看 ›' },
    { key: 'orders', group: 'journey', action: 'orders', b: '购物车', small: logged ? (pending ? pending + ' 笔待付款 ›' : '想买的都在这里 ›') : '登录后查看 ›' },
    { key: 'collections', group: 'content', action: 'collections', b: '我的收藏', small: '旅途笔记 ›' },
    { key: 'badges', group: 'content', action: 'badges', b: '旅行图鉴', small: logged && stats ? stats.badgeUnlocked + ' / ' + stats.badgeTotal + ' ›' : '登录后同步 ›' },
  ].concat(logged
    ? [
      { key: 'edit', group: 'account', action: 'edit', b: '编辑资料', small: '昵称 / 城市 / 头像 ›' },
      { key: 'stats', group: 'account', action: 'stats', b: '资产详情', small: '消费 / 公益 / 日记 ›' },
      { key: 'achievements', group: 'account', action: 'achievements', b: '行为成就', small: '查看解锁进度 ›' },
      { key: 'logout', group: 'account', action: 'logout', b: '退出登录', small: '重新登录后从后端恢复 ›' },
    ]
    : [{ key: 'login', group: 'account', action: 'login', b: '登录 / 注册', small: '手机验证码或微信 ›' }])
}

function currentTrip() {
  return state.trips.find((x) => x.id === currentTripId) || null
}

function snapshot() {
  const item = specialItem() || null
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
  const mineRows = mineMenu()
  return {
    moods: MOODS,
    categories: CATEGORIES,
    orderTabs: ORDER_TABS,
    refundReasons: REFUND_REASONS,
    mood: state.mood,
    category: state.category,
    moodPickOptions: MOOD_PICKS,
    moodPick,
    moodPickLine: (moodPickItem() || {}).line || '',
    moodPickLoading,
    moodPickEmpty: !!moodPick && !moodPickLoading && !moodPool.length,
    moodPickBox: (function () {
      const b = moodPickBox()
      if (!b) return null
      return {
        id: b.id,
        name: b.name,
        desc: b.desc,
        price: b.price,
        guarantee: b.guarantee,
        ratio: b.price ? Math.round(b.guarantee / b.price * 100) : 100,
        img: b.img,
      }
    })(),
    products: ui.searchActive ? searchResults : products(),
    productsEmpty: !(ui.searchActive ? searchResults : products()).length,
    contentLoaded,
    contentError,
    searchActive: ui.searchActive,
    searching: ui.searching,
    searchKeyword: ui.searchKeyword,
    special: item,
    specialName: splitTitle(item && item.name),
    specialDesc: specialDescText(item),
    specialPager: specialPager(),
    loggedIn: logged,
    msgBadge,
    msgBanner: ui.banner,
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
    mineMenu: mineRows,
    mineJourneyMenu: mineRows.filter((row) => row.group === 'journey'),
    mineContentMenu: mineRows.filter((row) => row.group === 'content'),
    mineAccountMenu: mineRows.filter((row) => row.group === 'account'),
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
  if (tabKey === 'trips') {
    wx.navigateTo({ url: '/pages/trips/index' })
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
  exitSearch()
  state.category = cat
  emit()
  hydrateRemote({ category: cat === 'all' ? undefined : cat, mood: state.mood === 'all' ? undefined : state.mood })
}

function filterMood(mood) {
  exitSearch()
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

function moodPickItem() {
  return MOOD_PICKS.find((item) => item.key === moodPick) || null
}

function moodPickBox() {
  return moodPool[moodPickIndex] || null
}

async function pickMood(key) {
  if (!MOOD_PICKS.some((item) => item.key === key)) return
  // 重复点击同一心情时当作“换一个”，减少一次请求
  if (moodPick === key && moodPool.length > 1) {
    rotateMoodPick()
    return
  }
  moodPick = key
  moodPickIndex = 0
  moodPool = []
  moodPickLoading = true
  emit()
  try {
    const api = require('../services/api')
    api.createMoodLog(key).catch(() => {})
    const list = normalizeBoxList(await api.listBoxes({ mood: key, page: 1, pageSize: 10 }))
    moodPool = list
    // 随机起点，让每次心情推送更有“盲”感
    moodPickIndex = list.length ? Math.floor(Math.random() * list.length) : 0
  } catch (e) {
    moodPool = []
    moodPickIndex = 0
  } finally {
    moodPickLoading = false
    emit()
  }
}

function rotateMoodPick() {
  if (!moodPool.length) return
  moodPickIndex = (moodPickIndex + 1) % moodPool.length
  emit()
}

function openMoodPick() {
  const box = moodPickBox()
  if (!box) return
  try {
    const api = require('../services/api')
    api.createMoodLog(moodPick, numericId(box.id)).catch(() => {})
  } catch (e) {}
  openUnboxModal(box.id)
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
  exitSearch()
  state.category = 'all'
  emit()
  hydrateRemote({ mood: state.mood === 'all' ? undefined : state.mood })
}

function onSearchInput(value) {
  ui.searchKeyword = String(value || '')
  emit()
}

function exitSearch() {
  ui.searchActive = false
  searchResults = []
}

async function submitSearch() {
  const keyword = (ui.searchKeyword || '').trim()
  if (!keyword) {
    clearSearch()
    return
  }
  ui.searching = true
  emit()
  try {
    const api = require('../services/api')
    const result = await api.listBoxes({ keyword, page: 1, pageSize: 20 })
    searchResults = normalizeBoxList(result)
    ui.searchActive = true
  } catch (e) {
    searchResults = []
    ui.searchActive = true
    showDemoToast('搜索失败，请稍后重试')
  } finally {
    ui.searching = false
    emit()
  }
}

function clearSearch() {
  ui.searchKeyword = ''
  exitSearch()
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
  refreshMsgBadge()
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
      // 上传服务器拿可共享 URL（社区里别人看到的是它）；本机显示用本地副本，避免真机直连图片失败
      let uploaded = ''
      if (/^(wxfile:|file:|http:|https:)/.test(picked) && picked.indexOf('data:image/') !== 0) {
        try { const up = await api.uploadImage(picked); uploaded = (up && up.url) || '' } catch (e) {}
      }
      const localCopy = persistAvatarSync(picked)
      info.avatarUrl = uploaded || localCopy || picked
      avatarSrc = localCopy || info.avatarUrl
      rememberAvatarPath(localCopy || info.avatarUrl)
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
  msgBadge = 0
  closeBanner()
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
  // 上传服务器给社区共享；本机显示用本地副本，真机上不依赖网络加载
  let uploaded = ''
  if (/^(wxfile:|file:|http:|https:)/.test(picked) && picked.indexOf('data:image/') !== 0) {
    try { const up = await api.uploadImage(picked); uploaded = (up && up.url) || '' } catch (e) {}
  }
  const localCopy = persistAvatarSync(picked)
  const path = uploaded || localCopy || picked
  rememberAvatarPath(localCopy || path)
  avatarSrc = localCopy || path
  // 已登录且上传成功则同步到后端资料，社区立即生效
  if (uploaded && wx.getStorageSync('token')) {
    const api = require('../services/api')
    api.updateProfile({ avatarUrl: uploaded }).then((user) => {
      if (user && user.avatarUrl) {
        state.user = Object.assign({}, state.user, { avatarUrl: user.avatarUrl })
        wx.setStorageSync('user', state.user)
        emit()
      }
    }).catch(() => {})
  }
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
    if (!payment || payment.mock !== true) {
      showDemoToast('当前环境未开启模拟支付')
      return
    }
    currentOrder = { ...currentOrder, payUrl: payment && payment.payUrl, payQrCode: payment && (payment.qrCodeBase64 || payment.qrCodeUrl), payMock: payment && payment.mock === true }
    const index = state.orders.findIndex((order) => order.no === currentOrder.no)
    if (index >= 0) state.orders[index] = currentOrder
    saveState()
    await refreshPaidOrder()
  } catch (e) {
    showDemoToast('模拟支付失败，请稍后重试')
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
  ui.drawStatusText = '正在验证订单信息'
  ui.unbox = true
  afterUi()
  const statuses = ['正在验证订单信息', '正在摇匀候选目的地', '正在匹配你的主题线路', '路线卡即将揭晓']
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
  currentBox = findBox(boxId) || moodPool.find((b) => b.id === boxId) || boxes[0]
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

async function openAiChat(id) {
  state.aiCurrentId = id
  saveState()
  emit()
  if (!state.loggedIn) return
  const session = state.aiSessions.find((s) => s.id === id)
  if (!session || session.loaded) return
  try {
    const api = require('../services/api')
    const history = await api.aiConversationMessages(id, { limit: 50 })
    session.messages = [{ role: 'bot', text: aiConfig.greet }].concat((history || []).map((message) => ({
      role: message.role === 'assistant' ? 'bot' : 'user',
      text: message.content,
      fallback: message.fallback === true,
    })))
    session.loaded = true
    saveState()
    emit()
  } catch (e) {
    showDemoToast('会话加载失败，请重试')
  }
}

async function newAiChat() {
  // 当前会话还没有用户消息时直接复用（清屏回到问候语），
  // 避免反复点“＋ 新对话”在服务端堆积一堆空的“新对话”
  const cur = currentAiSession()
  if (cur && !(cur.messages || []).some((m) => m.role === 'user')) {
    cur.title = '新对话'
    cur.time = '刚刚'
    cur.loaded = true
    cur.messages = [{ role: 'bot', text: aiConfig.greet || AI_GREET }]
    state.aiCurrentId = cur.id
    saveState()
    emit()
    return
  }
  if (!state.loggedIn) {
    const ses = blankAiSession()
    state.aiSessions.push(ses)
    state.aiCurrentId = ses.id
    saveState()
    emit()
    return
  }
  try {
    const api = require('../services/api')
    const created = await api.createAiConversation()
    const ses = {
      id: created.id,
      title: '新对话',
      time: '刚刚',
      messageCount: 0,
      loaded: true,
      messages: [{ role: 'bot', text: aiConfig.greet || AI_GREET }],
    }
    state.aiSessions.push(ses)
    state.aiCurrentId = ses.id
    saveState()
    emit()
  } catch (e) {
    showDemoToast('新对话创建失败')
  }
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
  let sid = state.aiCurrentId
  // 会话 id 必须属于当前登录用户，切换账号后残留的旧会话会被后端拒绝（403 无权访问该会话）
  const uid = state.loggedIn ? (wx.getStorageSync('user') || {}).id : null
  const sidOwned = (s) => !!s && !!uid && (s === 'user:' + uid || s.indexOf('user:' + uid + ':') === 0)
  if (state.loggedIn && !sidOwned(sid)) {
    try {
      const api = require('../services/api')
      const created = await api.createAiConversation()
      const current = currentAiSession() || blankAiSession()
      current.id = created.id
      state.aiSessions = (state.aiSessions || []).filter((s) => s.id === created.id || s.messages.length > 1)
      if (!state.aiSessions.some((s) => s.id === created.id)) state.aiSessions.push(current)
      state.aiCurrentId = created.id
      sid = created.id
    } catch (e) {
      showDemoToast('会话创建失败')
      return
    }
  }
  aiBusy = true
  persistAiMessage('user', text, null, sid)
  emit()
  try {
    const api = require('../services/api')
    const reply = await api.aiChat({
      text,
      viaQuick: viaQuick === true,
      sessionId: state.loggedIn ? sid : (state.aiGuestSessionId || undefined),
    })
    if (!state.loggedIn && reply.sessionId) state.aiGuestSessionId = reply.sessionId
    const ids = (reply.recommendBoxes || []).map((box) => 'box_' + box.id)
    await typeAiMessage(reply.content, ids, sid)
    if (reply.fallback) showDemoToast('小途已切换到本地旅行建议')
  } catch (e) {
    // 会话失效（无权访问/不存在）时自动建新会话重试一次
    const msg = (e && e.message) || ''
    let recovered = false
    if (state.loggedIn && (msg.indexOf('无权访问该会话') >= 0 || msg.indexOf('会话不存在') >= 0)) {
      try {
        const api = require('../services/api')
        const created = await api.createAiConversation()
        const cur = state.aiSessions.find((s) => s.id === sid) || currentAiSession() || blankAiSession()
        cur.id = created.id
        state.aiSessions = (state.aiSessions || []).filter((s) => s.id === created.id || s.messages.length > 1)
        if (!state.aiSessions.some((s) => s.id === created.id)) state.aiSessions.push(cur)
        state.aiCurrentId = created.id
        sid = created.id
        const retry = await api.aiChat({ text, viaQuick: viaQuick === true, sessionId: sid })
        const ids = (retry.recommendBoxes || []).map((box) => 'box_' + box.id)
        await typeAiMessage(retry.content, ids, sid)
        recovered = true
      } catch (retryError) {
        recovered = false
      }
    }
    if (!recovered) persistAiMessage('bot', '消息没有送达，请稍后再试。', null, sid)
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
      const conversations = await api.aiConversations()
      state.aiSessions = (conversations || []).slice().reverse().map((item) => ({
        id: item.id,
        title: item.title || '新对话',
        time: item.updatedAt ? String(item.updatedAt).slice(5, 16) : '已同步',
        preview: item.preview || '',
        messageCount: item.messageCount || 0,
        loaded: false,
        messages: [],
      }))
      if (!state.aiSessions.length) {
        const created = await api.createAiConversation()
        state.aiSessions = [{ id: created.id, title: '新对话', time: '刚刚', messageCount: 0, loaded: true, messages: [{ role: 'bot', text: aiConfig.greet }] }]
        state.aiCurrentId = created.id
      } else {
        // 恢复时优先落回最近一个有消息的会话；空的“新对话”不作为默认会话，
        // 否则重新打开小程序看起来就像聊天记录丢了
        const saved = state.aiSessions.find((s) => s.id === state.aiCurrentId)
        const withMessages = state.aiSessions.filter((s) => (s.messageCount || 0) > 0)
        if (saved && ((saved.messageCount || 0) > 0 || !withMessages.length)) {
          state.aiCurrentId = saved.id
        } else {
          state.aiCurrentId = (withMessages.length ? withMessages[withMessages.length - 1] : state.aiSessions[state.aiSessions.length - 1]).id
        }
      }
      await openAiChat(state.aiCurrentId)
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
  if (action === 'orders') wx.navigateTo({ url: '/pages/orders/index' })
  else if (action === 'login') openLogin({ type: 'mine' })
  else if (action === 'stats') wx.navigateTo({ url: '/pages/mine/stats-detail' })
  else if (action === 'edit') openProfileEditor()
  else if (action === 'badges') switchNav('badges')
  else if (action === 'trips') wx.navigateTo({ url: '/pages/trips/index' })
  else if (action === 'checkins') wx.navigateTo({ url: '/pages/checkin/index' })
  else if (action === 'collections') wx.navigateTo({ url: '/pages/community/collections' })
  else if (action === 'achievements') wx.navigateTo({ url: '/pages/achievements/index' })
  else if (action === 'points') wx.navigateTo({ url: '/pages/points/index' })
  else if (action === 'coupons') wx.navigateTo({ url: '/pages/coupon/index' })
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
    afterUi()
  } catch (e) {
    showDemoToast((e && e.message) || '资料保存失败')
  }
}

function normalizeBoxList(result) {
  const RANK_LABELS = { TOP1: '人气第1', TOP2: '热卖第2', TOP3: '精选第3', HOT: '热门', NEW: '新上架' }
  const list = Array.isArray(result) ? result : (result && Array.isArray(result.list) ? result.list : [])
  return list.map((item, i) => ({
    id: 'box_' + (item.id != null ? item.id : i),
    rank: RANK_LABELS[item.rankTag] || item.rankTag || item.tag || '',
    name: item.name || '',
    category: item.category || 'nearby',
    desc: item.intro || '',
    price: Number(item.price || 0),
    guarantee: Number(item.minValue || 0),
    moods: Array.isArray(item.moods) ? item.moods : [],
    // 管理端本地上传的封面是 /uploads/... 相对路径，须经 resolveMedia 拼接后端地址
    img: resolveMedia(item.coverUrl),
  }))
}

function applyRemoteBoxes(result) {
  if (!result) return
  boxes = normalizeBoxList(result)
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
    img: resolveMedia(item.boxCoverUrl) || findBox('box_' + item.boxId)?.img || '',
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

// 拉取个人资产统计（/me/stats）。登出状态不发起请求也不留错误文案，
// 避免与 getMe 的自动登出竞态后把红色错误残留在页面上；可重复调用用于重试。
function refreshStats() {
  try {
    const api = require('../services/api')
    if (!wx.getStorageSync('token')) {
      stats = null
      ui.statsError = ''
      emit()
      return
    }
    // 先渲染上次缓存，秒出骨架，再后台拉最新
    const uid = (wx.getStorageSync('user') || {}).id || 'me'
    const cached = wx.getStorageSync('xhs_stats_cache_' + uid)
    if (cached && !stats) { stats = cached; emit() }
    api.meStats().then((result) => {
      stats = result || null
      ui.statsError = ''
      if (stats) wx.setStorageSync('xhs_stats_cache_' + uid, stats)
      emit()
    }).catch(() => {
      if (stats) { ui.statsError = ''; emit(); return } // 有缓存数据时不报错
      stats = null
      ui.statsError = wx.getStorageSync('token') ? '数据加载失败 · 点击重试' : ''
      emit()
    })
  } catch (e) {}
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
        avatarUrl: keepAvatar(resolveMedia(user.avatarUrl) || cachedProfile.avatarUrl),
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
    refreshStats()
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
    // 首页缓存先行：上次数据立即渲染出内容，接口回来后覆盖（避免每次进首页都盯骨架转圈）
    if (!homeCacheTried) {
      homeCacheTried = true
      const cachedBoxes = wx.getStorageSync('home_cache_boxes')
      if (cachedBoxes && !boxes.length) applyRemoteBoxes(cachedBoxes)
      const cachedBadges = wx.getStorageSync('home_cache_badges')
      if (cachedBadges && !badgeCatalog.length) applyRemoteBadges(cachedBadges)
      const cachedBanners = wx.getStorageSync('home_cache_banners')
      if (cachedBanners && !banners.length) applyRemoteBanners(cachedBanners)
    }
    api.listBoxes(params)
      .then((list) => { if (list) wx.setStorageSync('home_cache_boxes', list); applyRemoteBoxes(list) })
      .catch(() => {
        if (!boxes.length) {
          boxes = []
          contentLoaded = true
          contentError = '盲盒加载失败，请下拉重试'
        }
        emit()
      })
    api.listBadges()
      .then((list) => { if (list) wx.setStorageSync('home_cache_badges', list); applyRemoteBadges(list) })
      .catch(() => {
        badgeCatalog = []
        badgeTotal = 0
        emit()
      })
    api.listBanners()
      .then((list) => { if (list) wx.setStorageSync('home_cache_banners', list); applyRemoteBanners(list) })
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

function refreshHome() {
  if (!contentLoaded || contentError) {
    contentLoaded = false
    contentError = ''
    emit()
  }
  const params = {}
  if (state.category && state.category !== 'all') params.category = state.category
  if (state.mood && state.mood !== 'all') params.mood = state.mood
  hydrateRemote(params)
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
  if (state.loggedIn) { hydrateTransactions(); refreshMsgBadge() }
  hydrateAi()
  setupPushRelay()
  emit()
}

// ===== 消息提醒体系（仿小红书）：tab 角标 + 全局横幅 =====
const NOTICE_BANNER_TEXT = {
  like: '赞了你的笔记',
  comment: '评论了：',
  reply: '回复了：',
  follow: '关注了你',
  system: '系统通知',
}

function currentPage() {
  const pages = getCurrentPages()
  return pages[pages.length - 1] || null
}

/** 刷新底部「消息」tab 角标：私信未读 + 通知未读 */
async function refreshMsgBadge() {
  if (!isLoggedIn()) {
    if (msgBadge !== 0) { msgBadge = 0; emit() }
    return
  }
  const seq = ++msgBadgeSeq
  try {
    const api = require('../services/api')
    const [dm, notice] = await Promise.all([
      api.dmUnreadTotal(),
      api.notificationUnread(),
    ])
    if (seq !== msgBadgeSeq) return // 过期响应丢弃
    // 接口返回 Result<Long>：data 为纯数字（防御性兼容 {count}/{total} 包装）
    const num = (v) => (v && typeof v === 'object'
      ? Number(v.count != null ? v.count : (v.total != null ? v.total : 0))
      : Number(v)) || 0
    const total = num(dm) + num(notice)
    if (total !== msgBadge) { msgBadge = total; emit() }
  } catch (e) { /* 静默：角标下次推送/进消息中心再刷 */ }
}

/** 弹全局横幅（tuge-overlay 顶部），4.5s 自动收起；头像异步本地化后回填 */
function showBanner(banner) {
  if (bannerTimer) { clearTimeout(bannerTimer); bannerTimer = null }
  const seq = ++bannerSeq
  ui.banner = {
    kind: banner.kind || 'notice',
    title: banner.title || '新消息',
    desc: String(banner.desc || '').slice(0, 40),
    avatar: '',
    peerUserId: banner.peerUserId || 0,
  }
  emit()
  bannerTimer = setTimeout(() => { ui.banner = null; bannerTimer = null; emit() }, 4500)
  const raw = banner.avatarUrl || ''
  if (raw) {
    fetchDisplayMedia(resolveMedia(raw)).then((local) => {
      // 期间横幅可能已被下一条替换或关闭，避免回填到旧横幅
      if (ui.banner && bannerSeq === seq) { ui.banner.avatar = local || ''; emit() }
    }).catch(() => { /* 无头像时回落到类型图标 */ })
  }
}

function closeBanner() {
  if (bannerTimer) { clearTimeout(bannerTimer); bannerTimer = null }
  if (ui.banner) { ui.banner = null; emit() }
}

/** 点横幅：私信进聊天页 / 通知进消息中心 */
function bannerTap() {
  const b = ui.banner
  closeBanner()
  if (!b) return
  if (b.kind === 'dm' && b.peerUserId) {
    wx.navigateTo({ url: '/pages/message/chat?peerUserId=' + b.peerUserId + '&nickname=' + encodeURIComponent('私信') })
  } else {
    wx.switchTab({ url: '/pages/message/index' })
  }
}

/** WebSocket 推送 → 角标刷新 + 横幅（聊天页/消息中心内不弹对应横幅） */
function setupPushRelay() {
  if (setupPushRelay._done) return
  setupPushRelay._done = true
  push.subscribe((data) => {
    if (!isLoggedIn()) return
    if (data.channel === 'dm') {
      refreshMsgBadge()
      const cur = currentPage()
      const onChat = cur && cur.route && cur.route.indexOf('pages/message/chat') >= 0
      if (!onChat) showBanner({
        kind: 'dm',
        title: data.fromNickname || '私信消息',
        desc: data.content || '',
        avatarUrl: data.fromAvatarUrl || '',
        peerUserId: data.fromUserId,
      })
    } else if (data.channel === 'notice') {
      refreshMsgBadge()
      const cur = currentPage()
      const onMsg = cur && cur.route && cur.route.indexOf('pages/message/index') >= 0
      if (!onMsg) {
        const action = NOTICE_BANNER_TEXT[data.type] || '有新通知'
        showBanner({
          kind: 'notice',
          title: (data.actorNickname ? data.actorNickname + ' ' : '') + action,
          desc: data.content || '',
          avatarUrl: data.actorAvatarUrl || '',
        })
      }
    }
  })
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
  refreshMsgBadge,
  closeBanner,
  bannerTap,
  refreshHome,
  setSpecial,
  openCurrentSpecial,
  filterCategory,
  filterMood,
  pickMood,
  rotateMoodPick,
  openMoodPick,
  handleBanner,
  filterCategoryAll,
  onSearchInput,
  submitSearch,
  clearSearch,
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
  refreshStats,
  setLoginPhone,
  setLoginSms,
  goHomeFromEmpty,
  switchNav,
  showDemoToast,
  requireLogin,
}
