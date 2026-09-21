const api = require('../../services/api')
Page({
  data: { overview: null, loading: true, error: '', signing: false },
  onShow() { this.load() },
  async load() { this.setData({ loading: true, error: '' }); try { const overview = await api.getMyPoints(); this.setData({ overview, loading: false }) } catch (e) { this.setData({ loading: false, error: '积分加载失败' }) } },
  async signin() { if (this.data.signing) return; this.setData({ signing: true }); try { const res = await api.signin(); const title = res.alreadySignedIn ? '今日已签到' : '签到成功 +' + res.pointsEarned + ' 积分'; wx.showToast({ title, icon: 'none' }); } catch (e) { } finally { this.setData({ signing: false }); this.load() } },
  openHistory() { wx.navigateTo({ url: '/pages/points/history' }) },
  openMall() { wx.navigateTo({ url: '/pages/points/mall' }) },
  openCoupons() { wx.navigateTo({ url: '/pages/coupon/index' }) },
  retry() { this.load() },
})
