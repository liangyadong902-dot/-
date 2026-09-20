const api = require('../../services/api')
Page({
  data: { loading: true, list: [], error: '' },
  onShow() { this.load() },
  async load() { this.setData({ loading: true }); try { const res = await api.listMyCheckins({ page: 1, pageSize: 50 }); this.setData({ list: res.list || [], loading: false }) } catch (e) { this.setData({ loading: false, error: '打卡记录加载失败' }) } },
  openDetail(e) { wx.navigateTo({ url: '/pages/checkin/detail?id=' + e.currentTarget.dataset.id }) },
  openRankings() { wx.navigateTo({ url: '/pages/checkin/rankings' }) },
})
