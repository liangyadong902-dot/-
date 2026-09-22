const api = require('../../services/api')
const { fetchDisplayMedia } = require('../../utils/request')

// 关注 / 粉丝列表：顶部 Tab 切换，行内可直接关注/取关，点头像跳对方主页
Page({
  data: {
    tab: 'following',
    userId: null,
    list: [],
    loading: true,
    error: '',
    page: 1,
    hasMore: false,
  },
  onLoad(options) {
    const user = wx.getStorageSync('user') || {}
    const id = Number(options.id) || user.id || null
    const tab = options.tab === 'followers' ? 'followers' : 'following'
    if (!id) {
      this.setData({ loading: false, error: '请先登录后查看' })
      wx.setNavigationBarTitle({ title: tab === 'followers' ? '粉丝' : '关注' })
      return
    }
    this.setData({ userId: id, tab })
    wx.setNavigationBarTitle({ title: tab === 'followers' ? '粉丝' : '关注' })
    this.load()
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.tab) return
    this.setData({ tab, list: [], page: 1, hasMore: false })
    wx.setNavigationBarTitle({ title: tab === 'followers' ? '粉丝' : '关注' })
    this.load()
  },
  async load(append) {
    const { tab, userId, page } = this.data
    this.setData({ loading: true })
    try {
      const fetcher = tab === 'followers' ? api.listFollowers : api.listFollowing
      const res = await fetcher(userId, { page, pageSize: 30 })
      const rows = (res && res.list) || []
      // 头像先展示远程地址，逐个换成本地缓存路径（真机渲染层加载不了明文 http）
      const decorated = rows.map((u) => ({
        userId: u.userId,
        nickname: u.nickname || '旅行者',
        initial: (u.nickname || '旅')[0],
        avatarUrl: u.avatarUrl || '',
        city: u.city || '',
        followed: !!u.followed,
        followerCount: u.followerCount || 0,
        self: false,
      }))
      const user = wx.getStorageSync('user') || {}
      decorated.forEach((u) => { u.self = u.userId === user.id })
      const list = append ? this.data.list.concat(decorated) : decorated
      this.setData({ list, loading: false, error: '', hasMore: !!(res && res.hasMore), page: page + 1 })
      this.hydrateAvatars(append ? decorated : list)
    } catch (e) {
      this.setData({ loading: false, error: (e && e.message) || '列表加载失败' })
    }
  },
  async hydrateAvatars(rows) {
    for (const u of rows) {
      if (!u.avatarUrl) continue
      const local = await fetchDisplayMedia(u.avatarUrl).catch(() => '')
      if (!local) continue
      const idx = this.data.list.findIndex((x) => x.userId === u.userId)
      if (idx >= 0) this.setData({ ['list[' + idx + '].avatarUrl']: local })
    }
  },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.load(true)
  },
  async toggleFollow(e) {
    const { id, followed } = e.currentTarget.dataset
    const idx = this.data.list.findIndex((x) => x.userId === id)
    if (idx < 0 || this.data.list[idx].self) return
    const next = !followed
    try {
      await api.followCommunityUser(id, next)
      this.setData({ ['list[' + idx + '].followed']: next })
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
    }
  },
  goProfile(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/profile/index?id=' + id })
  },
})
