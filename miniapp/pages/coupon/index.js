const api = require('../../services/api')
const { createRequestId } = require('../../utils/request-id')
Page({
  data: { status: 'unused', list: [], loading: false, error: '', empty: false },
  onShow() { this.load() },
  async load() { this.setData({ loading: true, error: '' }); try { const list = await api.listMyCoupons({ status: this.data.status }); this.setData({ list: list || [], empty: !(list && list.length), loading: false }) } catch (e) { this.setData({ loading: false, error: '加载失败，请重试' }) } },
  switchStatus(e) { this.setData({ status: e.currentTarget.dataset.status }, () => this.load()) },
  openDetail(e) { wx.navigateTo({ url: '/pages/coupon/detail?id=' + e.currentTarget.dataset.id }) },
  retry() { this.load() },
})
