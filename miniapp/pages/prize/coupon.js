const api = require('../../services/api')
Page({
  data: { item: null, loading: true, error: '' },
  onLoad(options) { this.id = options.id; this.load() },
  async load() { this.setData({ loading: true, error: '' }); try { const item = await api.getPrize(this.id); this.setData({ item, loading: false }) } catch (e) { this.setData({ loading: false, error: '奖品加载失败' }) } },
  openCoupon() { if (this.data.item && this.data.item.userCouponId) wx.navigateTo({ url: '/pages/coupon/detail?id=' + this.data.item.userCouponId }) },
  retry() { this.load() },
})
