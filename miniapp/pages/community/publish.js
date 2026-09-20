const api = require('../../services/api')

Page({
  data: { title: '', content: '', images: [], topics: [], topicId: null, topicName: '', locationName: '', sending: false, uploadProgress: '' },
  onLoad() { api.listTopics({ page: 1, pageSize: 50 }).then((res) => this.setData({ topics: res.list || [] })).catch(() => {}) },
  inputTitle(e) { this.setData({ title: e.detail.value }) },
  inputContent(e) { this.setData({ content: e.detail.value }) },
  inputLocation(e) { this.setData({ locationName: e.detail.value }) },
  chooseTopic(e) { this.setData({ topicId: e.currentTarget.dataset.id, topicName: e.currentTarget.dataset.name }) },
  chooseImages() {
    const remain = 9 - this.data.images.length
    if (!remain) return wx.showToast({ title: '最多9张图片', icon: 'none' })
    wx.chooseMedia({ count: remain, mediaType: ['image'], sourceType: ['album', 'camera'], success: (res) => this.setData({ images: this.data.images.concat((res.tempFiles || []).map((item) => item.tempFilePath)) }) })
  },
  removeImage(e) { const images = this.data.images.slice(); images.splice(e.currentTarget.dataset.index, 1); this.setData({ images }) },
  async submit() {
    if (this.data.sending) return
    if (!this.data.title.trim() || !this.data.content.trim()) return wx.showToast({ title: '请填写标题和正文', icon: 'none' })
    this.setData({ sending: true, uploadProgress: this.data.images.length ? '正在上传图片…' : '' })
    try {
      const imageUrls = []
      for (let i = 0; i < this.data.images.length; i++) { this.setData({ uploadProgress: '正在上传图片 ' + (i + 1) + '/' + this.data.images.length }); const item = await api.uploadImage(this.data.images[i]); imageUrls.push(item.url) }
      await api.createCommunityPost({ title: this.data.title.trim(), content: this.data.content.trim(), imageUrls, topicId: this.data.topicId, locationName: this.data.locationName.trim() || undefined, publicLocation: false })
      wx.showModal({ title: '已提交', content: '帖子已进入审核队列，审核通过后会出现在社区。', showCancel: false, success: () => wx.navigateBack() })
    } catch (e) { wx.showToast({ title: e.message || '发布失败，请重试', icon: 'none' }) } finally { this.setData({ sending: false, uploadProgress: '' }) }
  },
})
