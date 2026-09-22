const api = require('../../services/api')
const { fetchDisplayMediaList, thumbMediaUrl } = require('../../utils/request')
const push = require('../../utils/push')
const store = require('../../utils/tuge-store')

// 小红书式消息聚合：三入口卡片 + 私信会话列表
const GROUP_TYPES = { like: ['like'], comment: ['comment', 'reply', 'system'], follow: ['follow'] }
const GROUP_TITLE = { like: '赞和收藏', comment: '评论和@', follow: '新增关注' }
const ACTION_TEXT = { like: '赞了你的笔记', comment: '评论了：', reply: '回复了：', follow: '关注了你', system: '' }
const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function pad(n) { return n < 10 ? '0' + n : '' + n }
function parseTime(value) {
  if (!value) return 0
  const t = new Date(String(value).replace('T', ' ').slice(0, 19).replace(/-/g, '/')).getTime()
  return Number.isNaN(t) ? 0 : t
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime() }
function sameDay(a, b) { return startOfDay(a) === startOfDay(b) }

// 列表时间：今天 HH:mm，一周内 星期X，更早 M月D日
function fmtListTime(value) {
  const ts = parseTime(value)
  if (!ts) return ''
  const d = new Date(ts)
  if (sameDay(ts, Date.now())) return pad(d.getHours()) + ':' + pad(d.getMinutes())
  const diffDays = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86400000)
  if (diffDays >= 1 && diffDays <= 6) return '星期' + WEEK[d.getDay()]
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

// 自绘导航度量：状态栏高度 + 胶囊对齐的右侧留白
function navMetrics() {
  const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  const statusBarHeight = win.statusBarHeight || 44
  let navHeight = statusBarHeight + 44
  let iconRight = 10
  try {
    const rect = wx.getMenuButtonBoundingClientRect()
    navHeight = statusBarHeight + rect.height + (rect.top - statusBarHeight) * 2
    iconRight = win.windowWidth - rect.left + 6
  } catch (e) { }
  return { statusBarHeight, navHeight, iconRight }
}

Page({
  data: {
    view: 'home',
    group: '',
    title: '消息',
    statusBarHeight: 44,
    navHeight: 88,
    iconRight: 10,
    searchOpen: false,
    keyword: '',
    notices: [],
    filtered: [],
    conversations: [],
    convView: [],
    counts: { like: 0, comment: 0, follow: 0 },
    loading: true,
  },
  onLoad() { this.setData(navMetrics()) },
  onShow() {
    this.load()
    // 实时推送：收到新通知/私信立刻刷新列表
    this._unsubPush = push.subscribe(() => this.load())
  },
  onHide() { this.teardown() },
  onUnload() { this.teardown() },
  teardown() { if (this._unsubPush) { this._unsubPush(); this._unsubPush = null } },

  async load() {
    this.setData({ loading: true })
    const uid = (wx.getStorageSync('user') || {}).id || 'me'
    const cKey = 'xhs_msg_cache_' + uid
    // 先渲染上次缓存（省去网络 JSON，头像封面走媒体持久缓存），远端回来后覆盖
    if (!this._cachedTried) {
      this._cachedTried = true
      const cached = wx.getStorageSync(cKey)
      if (cached && Array.isArray(cached.noticeList) && Array.isArray(cached.convList)) {
        try { await this.applyLists(cached.noticeList, cached.convList, '') } catch (e) { /* 缓存渲染失败不影响正式拉取 */ }
      }
    }
    try {
      const [noticeData, convData] = await Promise.all([
        api.listNotifications({ page: 1, pageSize: 50 }),
        api.listConversations(),
      ])
      await this.applyLists(noticeData.list || [], convData.list || [], cKey)
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  async applyLists(noticeList, convList, cKey) {
    // 未读数按三个入口分组聚合
    const counts = { like: 0, comment: 0, follow: 0 }
    noticeList.forEach((n) => {
      if (n.read) return
      for (const g of Object.keys(GROUP_TYPES)) {
        if (GROUP_TYPES[g].indexOf(n.type) >= 0) { counts[g]++; break }
      }
    })
    // 头像 / 帖子封面统一走本地展示缓存（真机 http 图片需 downloadFile）
    const avatarUrls = noticeList.map((n) => n.actorAvatarUrl).filter(Boolean)
    const coverUrls = noticeList.map((n) => (n.postCoverUrl ? thumbMediaUrl(n.postCoverUrl, 200) : '')).filter(Boolean)
    const peerUrls = convList.map((c) => c.peerAvatarUrl).filter(Boolean)
    const [avatarList, coverList, peerList] = await Promise.all([
      fetchDisplayMediaList(avatarUrls, 8),
      fetchDisplayMediaList(coverUrls, 6),
      fetchDisplayMediaList(peerUrls, 8),
    ])
    const aMap = {}; avatarUrls.forEach((u, i) => { aMap[u] = avatarList[i] })
    const cMap = {}; coverUrls.forEach((u, i) => { cMap[u] = coverList[i] })
    const pMap = {}; peerUrls.forEach((u, i) => { pMap[u] = peerList[i] })
    const notices = noticeList.map((n) => ({
      id: n.id,
      type: n.type,
      action: ACTION_TEXT[n.type] || '',
      actor: n.actorNickname || '用户',
      avatar: aMap[n.actorAvatarUrl || ''] || '',
      content: n.content || '',
      cover: n.postCoverUrl ? (cMap[thumbMediaUrl(n.postCoverUrl, 200)] || '') : '',
      postId: n.postId,
      actorId: n.actorId,
      read: n.read,
      time: fmtListTime(n.createdAt),
    }))
    const conversations = convList.map((c) => ({
      id: c.id,
      peerUserId: c.peerUserId,
      nickname: c.peerNickname || '用户',
      avatar: pMap[c.peerAvatarUrl || ''] || '',
      lastMessage: c.lastMessage || '',
      time: fmtListTime(c.lastMessageAt),
      unread: c.unreadCount || 0,
    }))
    this.setData({ notices, conversations, counts, loading: false })
    store.refreshMsgBadge()
    if (cKey) wx.setStorageSync(cKey, { noticeList, convList, savedAt: Date.now() })
    if (this.data.view === 'notice') this.applyFilter()
    this.applySearch()
  },

  applyFilter() {
    const types = GROUP_TYPES[this.data.group] || []
    this.setData({ filtered: this.data.notices.filter((n) => types.indexOf(n.type) >= 0) })
  },
  openGroup(e) {
    const group = e.currentTarget.dataset.group
    this.setData({ view: 'notice', group, title: GROUP_TITLE[group] || '通知' })
    this.applyFilter()
  },
  backHome() { this.setData({ view: 'home' }) },

  // AI搭子置顶入口 → AI 对话页
  openAiDm() { wx.navigateTo({ url: '/pages/ai/index' }) },

  // 顶部搜索：按昵称/最后消息过滤会话
  applySearch() {
    const kw = this.data.keyword.trim().toLowerCase()
    const list = !kw ? this.data.conversations : this.data.conversations.filter((c) =>
      (c.nickname || '').toLowerCase().indexOf(kw) >= 0 || (c.lastMessage || '').toLowerCase().indexOf(kw) >= 0)
    this.setData({ convView: list })
  },
  toggleSearch() {
    this.setData({ searchOpen: !this.data.searchOpen, keyword: '' })
    this.applySearch()
  },
  onKeyword(e) { this.setData({ keyword: e.detail.value }); this.applySearch() },
  onPlus() { wx.showToast({ title: '暂未开放', icon: 'none' }) },

  async openNotice(e) {
    const item = this.data.notices.find((n) => String(n.id) === String(e.currentTarget.dataset.id))
    if (!item) return
    if (!item.read) {
      api.markNotificationRead(item.id)
      item.read = true
      const counts = this.data.counts
      for (const g of Object.keys(GROUP_TYPES)) {
        if (GROUP_TYPES[g].indexOf(item.type) >= 0 && counts[g] > 0) { counts[g]--; break }
      }
      this.setData({ notices: this.data.notices.map((n) => n.id === item.id ? { ...n, read: true } : n), counts })
      if (this.data.view === 'notice') this.applyFilter()
    }
    if (item.postId) wx.navigateTo({ url: '/pages/community/post-detail?id=' + item.postId })
    else if (item.actorId) wx.navigateTo({ url: '/pages/profile/index?id=' + item.actorId })
  },
  openConversation(e) {
    const item = this.data.convView.find((c) => String(c.id) === String(e.currentTarget.dataset.id))
    if (!item) return
    // avatar 是本地展示路径（fetchDisplayMedia 产物），聊天页原样复用
    wx.navigateTo({ url: '/pages/message/chat?peerUserId=' + item.peerUserId + '&nickname=' + encodeURIComponent(item.nickname) + '&avatar=' + encodeURIComponent(item.avatar || '') })
  },
  async markAll() {
    try {
      await api.markAllNotificationsRead()
      wx.showToast({ title: '已全部标记已读', icon: 'none' })
      this.load()
    } catch (e) { }
  },
})
