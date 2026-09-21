const api = require('../../services/api')
const { fetchDisplayMedia, fetchDisplayMediaList } = require('../../utils/request')
const push = require('../../utils/push')

const TYPE_LABEL = { like: '赞', comment: '评论', reply: '回复', follow: '关注', system: '系统' }

function fmtTime(value) {
  if (!value) return ''
  const s = String(value).replace('T', ' ')
  return s.slice(5, 16)
}

Page({
  data: { tab: 'notice', notices: [], conversations: [], loading: true, noticeUnread: 0, dmUnread: 0 },
  onShow() {
    this.load()
    // 实时推送：收到新通知/私信立刻刷新列表和角标
    this._unsubPush = push.subscribe(() => this.load())
  },
  onHide() { this.teardown() },
  onUnload() { this.teardown() },
  teardown() { if (this._unsubPush) { this._unsubPush(); this._unsubPush = null } },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }) },
  async load() {
    this.setData({ loading: true })
    try {
      const [noticeData, convData, noticeUnread, dmUnread] = await Promise.all([
        api.listNotifications({ page: 1, pageSize: 50 }),
        api.listConversations(),
        api.notificationUnread(),
        api.dmUnreadTotal(),
      ])
      const noticeList = noticeData.list || []
      const avatarUrls = noticeList.map((n) => n.actorAvatarUrl).filter(Boolean)
      const convList = convData.list || []
      const peerUrls = convList.map((c) => c.peerAvatarUrl).filter(Boolean)
      const [noticeAvatars, peerAvatars] = await Promise.all([
        fetchDisplayMediaList(avatarUrls, 8),
        fetchDisplayMediaList(peerUrls, 8),
      ])
      const aMap = {}; avatarUrls.forEach((u, i) => { aMap[u] = noticeAvatars[i] })
      const pMap = {}; peerUrls.forEach((u, i) => { pMap[u] = peerAvatars[i] })
      const notices = noticeList.map((n) => ({
        id: n.id,
        type: n.type,
        label: TYPE_LABEL[n.type] || '通知',
        actor: n.actorNickname || '用户',
        avatar: aMap[n.actorAvatarUrl || ''] || '',
        content: n.content || '',
        time: fmtTime(n.createdAt),
        read: n.read,
        postId: n.postId,
        actorId: n.actorId,
      }))
      const conversations = convList.map((c) => ({
        id: c.id,
        peerUserId: c.peerUserId,
        nickname: c.peerNickname || '用户',
        avatar: pMap[c.peerAvatarUrl || ''] || '',
        lastMessage: c.lastMessage || '',
        time: fmtTime(c.lastMessageAt),
        unread: c.unreadCount || 0,
      }))
      this.setData({ notices, conversations, noticeUnread, dmUnread, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },
  async openNotice(e) {
    const item = this.data.notices.find((n) => String(n.id) === String(e.currentTarget.dataset.id))
    if (!item) return
    if (!item.read) { api.markNotificationRead(item.id); item.read = true; this.setData({ notices: this.data.notices.map((n) => n.id === item.id ? { ...n, read: true } : n), noticeUnread: Math.max(0, this.data.noticeUnread - 1) }) }
    if (item.postId) wx.navigateTo({ url: '/pages/community/post-detail?id=' + item.postId })
    else if (item.actorId) wx.navigateTo({ url: '/pages/profile/index?id=' + item.actorId })
  },
  openConversation(e) {
    const item = this.data.conversations.find((c) => String(c.id) === String(e.currentTarget.dataset.id))
    if (!item) return
    wx.navigateTo({ url: '/pages/message/chat?peerUserId=' + item.peerUserId + '&nickname=' + encodeURIComponent(item.nickname) })
  },
  async markAll() {
    try { await api.markAllNotificationsRead(); wx.showToast({ title: '已全部标记已读', icon: 'none' }); this.load() } catch (e) { }
  },
})
