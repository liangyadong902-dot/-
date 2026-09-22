const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')
const api = require('../../services/api')
const { fetchDisplayMediaList, thumbMediaUrl, resolveMedia } = require('../../utils/request')

// 小红书式个人中心：头部资料 + 快捷卡 + 白面板(笔记/打卡/收藏) + 抽屉菜单
Page(makePage(4, {
  onMenu(e) { store.onMineMenu(e.currentTarget.dataset.action) },
  onAvatarError() { store.recoverAvatarDisplay() },
  onStatsRetry() { store.refreshStats() },
  // 在本页弹层里完成登录时不会重新 onShow：监听登录状态跳变，重拉个人资料与内容
  onStoreUpdate(s) {
    if (s.loggedIn && !this._loggedIn) {
      this.loadXhsProfile()
      this.refreshBadges()
      this.loadTab(this.data.xTab, true)
    }
    this._loggedIn = s.loggedIn
  },
  onStoreShow() {
    this.refreshBadges()
    this.loadXhsProfile()
    this.loadTab(this.data.xTab, true)
  },
  goProfile() {
    const user = wx.getStorageSync('user') || {}
    if (!user.id || !wx.getStorageSync('token')) { store.openLogin({ type: 'mine' }); return }
    wx.navigateTo({ url: '/pages/profile/index?me=1' })
  },
  goMessages() {
    if (!wx.getStorageSync('token')) { store.openLogin({ type: 'mine' }); return }
    wx.switchTab({ url: '/pages/message/index' })
  },
  goFollowList(e) {
    if (!this.data.xLoggedIn) { store.openLogin({ type: 'mine' }); return }
    const user = wx.getStorageSync('user') || {}
    if (!user.id) return
    const tab = e.currentTarget.dataset.tab === 'followers' ? 'followers' : 'following'
    wx.navigateTo({ url: '/pages/community/follow-list?id=' + user.id + '&tab=' + tab })
  },
  async refreshBadges() {
    if (!wx.getStorageSync('token')) return
    try {
      const [notice, dm] = await Promise.all([api.notificationUnread(), api.dmUnreadTotal()])
      const num = (v) => Number(v && (v.count != null ? v.count : v.total != null ? v.total : v)) || 0
      this.setData({ msgBadge: num(notice) + num(dm) })
    } catch (e) { /* 静默 */ }
  },

  // ── 小红书式改版 ──
  onLoad() {
    const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const user = wx.getStorageSync('user') || {}
    this.setData({
      xStatusBar: win.statusBarHeight || 44,
      xUserId: user.id || '',
      xNickInit: ((store.snapshot().mineNick) || '途')[0] || '途',
      xTab: 'posts',
    })
  },
  toggleDrawer() { this.setData({ xDrawer: !this.data.xDrawer }) },
  copyUid() {
    if (!this.data.xUserId) return
    wx.setClipboardData({ data: String(this.data.xUserId) })
  },

  async loadXhsProfile() {
    const user = wx.getStorageSync('user') || {}
    if (!user.id || !wx.getStorageSync('token')) {
      this.setData({ xLoggedIn: false })
      return
    }
    this.setData({ xLoggedIn: true })
    // 先渲染缓存统计，再后台拉最新
    const cKey = 'xhs_profile_cache_' + user.id
    const cached = wx.getStorageSync(cKey)
    if (cached && !this._xProfileLoaded) {
      this.setData({
        xFollowing: cached.followingCount || 0,
        xFollowers: cached.followerCount || 0,
        xLikes: cached.likeReceivedCount || 0,
        xCity: cached.city || '',
      })
    }
    try {
      const p = await api.getUserProfile(user.id)
      if (!p) return
      this._xProfileLoaded = true
      this.setData({
        xFollowing: p.followingCount || 0,
        xFollowers: p.followerCount || 0,
        xLikes: p.likeReceivedCount || 0,
        xCity: p.city || '',
      })
      wx.setStorageSync(cKey, {
        followingCount: p.followingCount || 0,
        followerCount: p.followerCount || 0,
        likeReceivedCount: p.likeReceivedCount || 0,
        city: p.city || '',
        savedAt: Date.now(),
      })
    } catch (e) { /* 静默：保持占位 */ }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.xTab) return
    this.setData({ xTab: tab })
    this.loadTab(tab)
  },

  async loadTab(tab, force) {
    const loadedKey = '_loaded_' + tab
    if (!force && this[loadedKey]) return
    if (!wx.getStorageSync('token')) return
    const uid = (wx.getStorageSync('user') || {}).id || 'me'
    const cKey = 'xhs_tab_' + uid + '_' + tab
    // 先渲染上次缓存（封面走媒体持久缓存，二次进入近乎秒开），再后台拉最新
    if (!this[loadedKey]) {
      const cached = wx.getStorageSync(cKey)
      if (cached && Array.isArray(cached.list) && cached.list.length) {
        if (tab === 'checkins') await this.renderCheckins(cached.list)
        else this.setData({ xGrid: await this.mapPostGrid(cached.list) })
      }
    }
    this.setData({ xLoading: true })
    try {
      let list
      if (tab === 'checkins') list = await this.fetchCheckins()
      else if (tab === 'favs') list = ((await api.listCollections({ page: 1, pageSize: 20 })) || {}).list || []
      else list = ((await api.listMyPosts({ page: 1, pageSize: 20 })) || {}).list || []
      if (tab === 'checkins') await this.renderCheckins(list)
      else this.setData({ xGrid: await this.mapPostGrid(list) })
      wx.setStorageSync(cKey, { list, savedAt: Date.now() })
      this[loadedKey] = true
    } catch (e) {
      // 拉取失败时保留缓存渲染内容，不白屏
    } finally {
      this.setData({ xLoading: false })
    }
  },

  // 帖子 VO：postId / imageUrls / likeCount —— 封面取第一张图
  async mapPostGrid(list) {
    const rawOf = (p) => (Array.isArray(p.imageUrls) && p.imageUrls[0]) || ''
    const urls = list.map((p) => thumbMediaUrl(rawOf(p), 400)).filter(Boolean)
    const covers = await fetchDisplayMediaList(urls, 6)
    const cMap = {}; urls.forEach((u, i) => { cMap[u] = covers[i] })
    return list.map((p) => {
      const raw = rawOf(p)
      const key = raw ? thumbMediaUrl(raw, 400) : ''
      return {
        id: p.postId,
        title: p.title || (p.content || '').slice(0, 40) || '途个惊喜',
        cover: key ? (cMap[key] || resolveMedia(raw)) : '',
        likes: typeof p.likeCount === 'number' ? p.likeCount : '',
      }
    })
  },

  async fetchCheckins() {
    const res = await api.listMyCheckins({ page: 1, pageSize: 20 })
    return (res && res.list) || []
  },

  async renderCheckins(list) {
    const rawOf = (c) => c.posterUrl || (Array.isArray(c.imageUrls) && c.imageUrls[0]) || ''
    const urls = list.map((c) => thumbMediaUrl(rawOf(c), 300)).filter(Boolean)
    const covers = await fetchDisplayMediaList(urls, 6)
    const cMap = {}; urls.forEach((u, i) => { cMap[u] = covers[i] })
    const xCheckins = list.map((c) => {
      const raw = rawOf(c)
      const key = raw ? thumbMediaUrl(raw, 300) : ''
      return {
        id: c.checkinId,
        title: c.locationName || c.note || '旅途打卡',
        time: this.fmtTime(c.createdAt),
        cover: key ? (cMap[key] || resolveMedia(raw)) : '',
      }
    })
    this.setData({ xCheckins })
  },

  fmtTime(v) {
    if (!v) return ''
    const d = new Date(String(v).replace('T', ' ').slice(0, 19).replace(/-/g, '/'))
    if (Number.isNaN(d.getTime())) return ''
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  },

  openPost(e) {
    wx.navigateTo({ url: '/pages/community/post-detail?id=' + e.currentTarget.dataset.id })
  },
  goPublish() {
    if (!wx.getStorageSync('token')) { store.openLogin({ type: 'mine' }); return }
    wx.navigateTo({ url: '/pages/community/publish' })
  },

  onShareAppMessage() {
    const s = store.snapshot()
    return { title: (s.mineNick || '我') + ' 的旅行主页', path: '/pages/index/index' }
  },
}))
