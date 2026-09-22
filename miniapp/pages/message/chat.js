const api = require('../../services/api')
const { fetchDisplayMedia, fetchDisplayMediaList, thumbMediaUrl, resolveMedia } = require('../../utils/request')
const push = require('../../utils/push')
const store = require('../../utils/tuge-store')

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function pad(n) { return n < 10 ? '0' + n : '' + n }
function parseTime(value) {
  if (!value) return 0
  const t = new Date(String(value).replace('T', ' ').slice(0, 19).replace(/-/g, '/')).getTime()
  return Number.isNaN(t) ? 0 : t
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime() }
function sameDay(a, b) { return startOfDay(a) === startOfDay(b) }

// 居中时间分割：今天 HH:mm，一周内 星期X HH:mm，更早 M月D日 HH:mm；间隔 ≥ 5 分钟才显示
function fmtDivider(ts) {
  const d = new Date(ts)
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (sameDay(ts, Date.now())) return hm
  const diffDays = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86400000)
  if (diffDays >= 1 && diffDays <= 6) return '星期' + WEEK[d.getDay()] + ' ' + hm
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm
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
    peerUserId: null, peerNickname: '', peerInitial: '友', peerAvatar: '', myAvatar: '',
    messages: [], input: '', emojiOpen: false, sending: false, bottomAnchor: '',
    statusBarHeight: 44, navHeight: 88, iconRight: 10,
    quick: [['👋', '打个招呼'], ['😂', '哈哈哈'], ['❤️', '喜欢'], ['🙏', '谢谢啦'], ['👀', '在干嘛'], ['👍', '赞']],
  },
  onLoad(options) {
    this.setData(navMetrics())
    const user = wx.getStorageSync('user') || {}
    const peerUserId = Number(options.peerUserId)
    const nickname = decodeURIComponent(options.nickname || '')
    this.setData({
      peerUserId,
      peerNickname: nickname,
      peerInitial: (nickname || '友')[0] || '友',
    })
    // 自己头像与「我的」页同源：store 解析后的头像（优先本地文件副本），storage 兜底
    const snap = store.snapshot() || {}
    const myAvatar = snap.mineAvatar || user.avatarUrl || ''
    if (myAvatar) fetchDisplayMedia(myAvatar).then((src) => this.setData({ myAvatar: src })).catch(() => { })
    if (options.avatar) fetchDisplayMedia(decodeURIComponent(options.avatar)).then((src) => this.setData({ peerAvatar: src }))
    else this.fetchPeer()
    this.load()
  },
  // 入口没带头像/昵称时兜底：从服务端拉对方公开信息
  async fetchPeer() {
    try {
      const p = await api.getUserProfile(this.data.peerUserId)
      if (!p) return
      if (!this.data.peerNickname && p.nickname) {
        this.setData({ peerNickname: p.nickname, peerInitial: (p.nickname || '友')[0] || '友' })
      }
      if (!this.data.peerAvatar && p.avatarUrl) {
        fetchDisplayMedia(p.avatarUrl).then((src) => this.setData({ peerAvatar: src })).catch(() => { })
      }
    } catch (e) { /* 拉不到就维持占位 */ }
  },
  onShow() {
    this.timer = setInterval(() => this.load(true), 5000)
    // 实时推送：对方消息秒达（轮询仅作兜底）
    this._unsubPush = push.subscribe((msg) => {
      if (msg.channel === 'dm' && String(msg.fromUserId) === String(this.data.peerUserId)) this.load(true)
    })
  },
  onHide() { this.teardown(); store.refreshMsgBadge() },
  onUnload() { this.teardown(); store.refreshMsgBadge() },
  teardown() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    if (this._unsubPush) { this._unsubPush(); this._unsubPush = null }
  },
  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) wx.navigateBack()
    else wx.redirectTo({ url: '/pages/message/index' })
  },
  onMore() {
    if (!this.data.peerUserId) return
    wx.showActionSheet({
      itemList: ['查看TA的主页'],
      success: (res) => {
        if (res.tapIndex === 0) wx.navigateTo({ url: '/pages/profile/index?id=' + this.data.peerUserId })
      },
    })
  },
  async load(quiet) {
    if (!this.data.peerUserId) return
    try {
      const data = await api.listDmMessages(this.data.peerUserId, { page: 1, pageSize: 100 })
      const list = data.list || []
      // 图片消息：服务端缩略图 + 本地展示缓存（真机 http 图片需 downloadFile）
      const imgUrls = list.filter((m) => m.msgType === 'image').map((m) => thumbMediaUrl(m.content, 600))
      const imgPaths = await fetchDisplayMediaList(imgUrls, 6)
      const imgMap = {}; imgUrls.forEach((u, i) => { imgMap[u] = imgPaths[i] })
      let lastTs = 0
      const messages = list.map((m) => {
        const ts = parseTime(m.createdAt)
        const showTime = !lastTs || (ts && ts - lastTs >= 5 * 60 * 1000)
        if (ts) lastTs = ts
        const isImage = m.msgType === 'image'
        const thumbKey = isImage ? thumbMediaUrl(m.content, 600) : ''
        return {
          id: m.id,
          mine: m.mine,
          type: isImage ? 'image' : 'text',
          content: isImage ? '' : m.content,
          image: isImage ? (imgMap[thumbKey] || resolveMedia(m.content)) : '',
          preview: isImage ? resolveMedia(m.content) : '',
          divider: showTime && ts ? fmtDivider(ts) : '',
        }
      })
      const lastId = messages.length ? 'msg-' + messages[messages.length - 1].id : ''
      this.setData({ messages, bottomAnchor: lastId })
    } catch (e) { if (!quiet) wx.showToast({ title: '消息加载失败', icon: 'none' }) }
  },
  previewImage(e) {
    const url = e.currentTarget.dataset.preview
    if (url) wx.previewImage({ urls: [url] })
  },
  onInput(e) { this.setData({ input: e.detail.value }) },
  toggleEmoji() { this.setData({ emojiOpen: !this.data.emojiOpen }) },
  onEmojiSelect(e) { this.setData({ input: this.data.input + e.detail.emoji }) },
  // 快捷表情条：点击直接发送（emoji + 文案一起发，避免只发文字丢了表情）
  sendQuick(e) {
    const q = this.data.quick[Number(e.currentTarget.dataset.index)]
    this.sendText(q ? (q[0] + ' ' + q[1]) : '')
  },
  async sendText(content) {
    const text = (content || '').trim()
    if (!text || this.data.sending || !this.data.peerUserId) return
    this.setData({ sending: true })
    try {
      await api.sendDmMessage(this.data.peerUserId, text)
      await this.load(true)
    } catch (e) { wx.showToast({ title: (e && e.message) || '发送失败', icon: 'none' }) }
    finally { this.setData({ sending: false }) }
  },
  async send() {
    const content = this.data.input.trim()
    if (!content || this.data.sending) return
    await this.sendText(content)
    this.setData({ input: '', emojiOpen: false })
  },
  // 小红书式"+"发图片：选图（压缩）→ 上传 → 以 image 类型入库
  chooseImage() {
    if (this.data.sending) return
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.setData({ sending: true })
        try {
          const up = await api.uploadImage(file.tempFilePath)
          let url = up.url || ''
          const idx = url.indexOf('/uploads/')
          if (idx >= 0) url = url.slice(idx) // 统一存相对路径
          await api.sendDmMessage(this.data.peerUserId, url, 'image')
          await this.load(true)
        } catch (e) { wx.showToast({ title: (e && e.message) || '发送失败', icon: 'none' }) }
        finally { this.setData({ sending: false }) }
      },
    })
  },
})
