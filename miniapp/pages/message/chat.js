const api = require('../../services/api')
const { fetchDisplayMedia } = require('../../utils/request')
const push = require('../../utils/push')

function fmtTime(value) {
  if (!value) return ''
  const s = String(value).replace('T', ' ')
  const today = new Date()
  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  const todayStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate())
  if (s.slice(0, 10) === todayStr) return s.slice(11, 16)
  return s.slice(5, 16)
}

Page({
  data: { peerUserId: null, peerNickname: '', peerAvatar: '', myAvatar: '', messages: [], input: '', emojiOpen: false, sending: false, bottomAnchor: '' },
  onLoad(options) {
    const user = wx.getStorageSync('user') || {}
    const peerUserId = Number(options.peerUserId)
    this.setData({ peerUserId, peerNickname: decodeURIComponent(options.nickname || '') })
    wx.setNavigationBarTitle({ title: this.data.peerNickname || '私信' })
    if (user.avatarUrl) fetchDisplayMedia(user.avatarUrl).then((src) => this.setData({ myAvatar: src }))
    if (options.avatar) fetchDisplayMedia(decodeURIComponent(options.avatar)).then((src) => this.setData({ peerAvatar: src }))
    this.load()
  },
  onShow() {
    this.timer = setInterval(() => this.load(true), 5000)
    // 实时推送：对方消息秒达（轮询仅作兜底）
    this._unsubPush = push.subscribe((msg) => {
      if (msg.channel === 'dm' && String(msg.fromUserId) === String(this.data.peerUserId)) this.load(true)
    })
  },
  onHide() { this.teardown() },
  onUnload() { this.teardown() },
  teardown() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    if (this._unsubPush) { this._unsubPush(); this._unsubPush = null }
  },
  async load(quiet) {
    if (!this.data.peerUserId) return
    try {
      const data = await api.listDmMessages(this.data.peerUserId, { page: 1, pageSize: 100 })
      const messages = (data.list || []).map((m) => ({ id: m.id, mine: m.mine, content: m.content, time: fmtTime(m.createdAt) }))
      const lastId = messages.length ? 'msg-' + messages[messages.length - 1].id : ''
      this.setData({ messages, bottomAnchor: lastId })
    } catch (e) { if (!quiet) wx.showToast({ title: '消息加载失败', icon: 'none' }) }
  },
  onInput(e) { this.setData({ input: e.detail.value }) },
  toggleEmoji() { this.setData({ emojiOpen: !this.data.emojiOpen }) },
  onEmojiSelect(e) { this.setData({ input: this.data.input + e.detail.emoji }) },
  async send() {
    const content = this.data.input.trim()
    if (!content || this.data.sending) return
    this.setData({ sending: true })
    try {
      await api.sendDmMessage(this.data.peerUserId, content)
      this.setData({ input: '', emojiOpen: false })
      await this.load(true)
    } catch (e) { wx.showToast({ title: (e && e.message) || '发送失败', icon: 'none' }) }
    finally { this.setData({ sending: false }) }
  },
})
