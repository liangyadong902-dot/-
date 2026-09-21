const api = require('../../services/api')
const { createRequestId } = require('../../utils/request-id')
Page({
  data: { list: [], loading: true, error: '', empty: false, submitting: false, balance: 0, result: null },
  onShow() { this.load() },
  async load() { this.setData({ loading: true, error: '' }); try { const [items, overview] = await Promise.all([api.listPointItems(), api.getMyPoints()]); this.setData({ list: items || [], empty: !(items && items.length), balance: overview.balance, loading: false }) } catch (e) { this.setData({ loading: false, error: '商城里没有东西，请稍后再试' }) } },
  exchange(e) {
    if (this.data.submitting) return
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认兑换', content: '将扣除相应积分', success: (res) => { if (res.confirm) this.doExchange(id) } })
  },
  async doExchange(itemId) {
    this.setData({ submitting: true });
    try {
      const res = await api.exchangePointItem(itemId, createRequestId('EXCHANGE'))
      this.setData({ result: res })
      wx.showToast({ title: '兑换成功', icon: 'none' })
      this.load()
    } catch (err) { } finally { this.setData({ submitting: false }) }
  },
  openCoupon() { wx.navigateTo({ url: '/pages/coupon/index' }) },
  retry() { this.load() },
})
