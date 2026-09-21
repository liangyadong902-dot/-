const api = require('../../services/api')
const { fetchDisplayMedia, fetchDisplayMediaList } = require('../../utils/request')

function fmtDate(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 10)
}

Page({
  data: { userId: null, loading: true, profile: null, followed: false, isSelf: false, works: [], error: '' },
  onLoad(options) {
    const user = wx.getStorageSync('user') || {}
    let id = options.id && options.id !== 'me' ? Number(options.id) : (user.id || null)
    if (!id) { this.setData({ loading: false, error: '请先登录后查看主页' }); return }
    this.setData({ userId: id })
    this.load()
  },
  async load() {
    const id = this.data.userId
    this.setData({ loading: true })
    try {
      const profile = await api.getUserProfile(id)
      profile.joinedText = fmtDate(profile.joinedAt)
      // 头像需替换为本地文件路径再渲染：真机 image 渲染层加载不了明文 http 地址
      const avatar = profile.avatarUrl ? await fetchDisplayMedia(profile.avatarUrl) : ''
      if (avatar) profile.avatarUrl = avatar
      const data = await api.listUserPosts(id, { page: 1, pageSize: 50 })
      // 先渲染列表骨架（封面留空，布局立即就位可滑动），封面下载完成后逐个回填，
      // 避免 50 张图全部下载完成前整页白屏
      const works = (data.list || []).map((p) => ({
        id: p.postId,
        title: p.title,
        likeCount: p.likeCount || 0,
        commentCount: p.commentCount || 0,
        cover: '',
      }))
      this.setData({ profile, followed: !!profile.followed, isSelf: !!profile.self, works, loading: false })
      const covers = (data.list || []).map((p) => (p.imageUrls && p.imageUrls[0]) || '').filter(Boolean)
      const displayCovers = await fetchDisplayMediaList(covers)
      const coverMap = {}
      covers.forEach((c, i) => { coverMap[c] = displayCovers[i] })
      const patch = {}
      ;(data.list || []).forEach((p, i) => {
        const resolved = coverMap[(p.imageUrls && p.imageUrls[0]) || '']
        if (resolved) patch['works[' + i + '].cover'] = resolved
      })
      if (Object.keys(patch).length) this.setData(patch)
    } catch (e) {
      this.setData({ loading: false, error: (e && e.message) || '主页加载失败' })
    }
  },
  async toggleFollow() {
    if (this.data.isSelf || !this.data.userId) return
    try {
      await api.followCommunityUser(this.data.userId, !this.data.followed)
      this.setData({ followed: !this.data.followed })
      wx.showToast({ title: this.data.followed ? '已关注' : '已取消关注', icon: 'none' })
    } catch (e) { wx.showToast({ title: (e && e.message) || '操作失败', icon: 'none' }) }
  },
  goChat() {
    if (this.data.isSelf) return
    wx.navigateTo({ url: '/pages/message/chat?peerUserId=' + this.data.userId + '&nickname=' + encodeURIComponent((this.data.profile && this.data.profile.nickname) || '') })
  },
  openWork(e) { wx.navigateTo({ url: '/pages/community/post-detail?id=' + e.currentTarget.dataset.id }) },
})
