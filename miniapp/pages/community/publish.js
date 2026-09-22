const api = require('../../services/api')

Page({
  data: {
    title: '',
    content: '',
    images: [],
    topics: [],
    topicId: null,
    topicName: '',
    locationName: '',
    sending: false,
    uploadProgress: '',
    statusBarHeight: 20,
    navBarHeight: 44,
  },
  onLoad() {
    this.setNavMetrics()
    api.listTopics({ page: 1, pageSize: 50 }).then((res) => this.setData({ topics: res.list || [] })).catch(() => {})
  },
  setNavMetrics() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      const statusBarHeight = windowInfo.statusBarHeight || 20
      const navBarHeight = menuButton && menuButton.height
        ? (menuButton.top - statusBarHeight) * 2 + menuButton.height
        : 44
      this.setData({ statusBarHeight, navBarHeight })
    } catch (e) {}
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/community/index' })
  },
  inputTitle(e) { this.setData({ title: e.detail.value }) },
  inputContent(e) { this.setData({ content: e.detail.value }) },
  inputLocation(e) { this.setData({ locationName: e.detail.value }) },
  chooseTopic(e) {
    const rawId = e.currentTarget.dataset.id
    const topicId = rawId === undefined || rawId === '' ? null : Number(rawId)
    this.setData({ topicId: Number.isFinite(topicId) ? topicId : null, topicName: e.currentTarget.dataset.name || '' })
  },
  chooseImages() {
    const remain = 9 - this.data.images.length
    if (!remain) return wx.showToast({ title: '最多9张图片', icon: 'none' })
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = (res.tempFiles || []).filter((item) => item && item.tempFilePath)
        if (!files.length) return
        this.setData({ images: this.data.images.concat(files.map((item) => item.tempFilePath)) })
      },
      fail: (err) => {
        if (err && err.errMsg && /cancel/i.test(err.errMsg)) return
        wx.showToast({ title: '选择图片失败，请重试', icon: 'none' })
      },
    })
  },
  removeImage(e) { const images = this.data.images.slice(); images.splice(e.currentTarget.dataset.index, 1); this.setData({ images }) },
  async submit() {
    if (this.data.sending) return
    if (!this.data.title.trim() || !this.data.content.trim()) return wx.showToast({ title: '请填写标题和正文', icon: 'none' })
    if (!wx.getStorageSync('token')) {
      return wx.showModal({
        title: '请先登录',
        content: '登录后才能发布旅途笔记。',
        confirmText: '去登录',
        success: (res) => { if (res.confirm) wx.navigateTo({ url: '/pages/login/index' }) },
      })
    }
    this.setData({ sending: true, uploadProgress: this.data.images.length ? '正在上传图片…' : '' })
    try {
      const imageUrls = []
      for (let i = 0; i < this.data.images.length; i++) {
        this.setData({ uploadProgress: '正在上传图片 ' + (i + 1) + '/' + this.data.images.length })
        const item = await api.uploadImage(this.data.images[i])
        // 库里统一存 /uploads/xx 相对路径，各端展示时再按自己的后端地址补全，
        // 避免把上传端的 127.0.0.1 / 局域网 IP 固化到数据库里
        const uploaded = String(item.url || '')
        const relative = uploaded.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i)
        imageUrls.push(relative ? relative[1] : uploaded)
      }
      await api.createCommunityPost({ title: this.data.title.trim(), content: this.data.content.trim(), imageUrls, topicId: this.data.topicId, locationName: this.data.locationName.trim() || undefined, publicLocation: false })
      wx.showModal({ title: '已提交', content: '帖子已进入审核队列，审核通过后会出现在社区。', showCancel: false, success: () => wx.navigateBack() })
    } catch (e) {
      const message = (e && (e.message || e.errMsg)) || '发布失败，请重试'
      wx.showToast({ title: message.length > 20 ? message.slice(0, 20) + '…' : message, icon: 'none' })
    } finally { this.setData({ sending: false, uploadProgress: '' }) }
  },
})
