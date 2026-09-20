const api = require('../../services/api')
Page({
  data: { loading: true, posts: [], error: '' },
  onShow() { this.load() },
  async load() { this.setData({ loading: true }); try { const data = await api.listCollections({ page: 1, pageSize: 50 }); this.setData({ posts: data.list || [], loading: false }) } catch (e) { this.setData({ loading: false, error: '收藏加载失败' }) } },
  openPost(e) { wx.navigateTo({ url: '/pages/community/post-detail?id=' + e.currentTarget.dataset.id }) },
})
