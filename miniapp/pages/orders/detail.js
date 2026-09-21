const api = require('../../services/api')

Page({
  data: {
    order: null,
    loading: true,
    error: '',
    paying: false,
    unboxVisible: false,
    unboxStage: 'opening',
    unboxStatus: '正在验证订单信息',
  },
  onLoad(options) { this.orderNo = decodeURIComponent(options.orderNo || ''); this.load() },
  onUnload() {
    if (this.timer) clearTimeout(this.timer)
    if (this.unboxTimer) clearTimeout(this.unboxTimer)
    if (this.unboxStatusTimer) clearInterval(this.unboxStatusTimer)
  },
  async load() {
    try { const order = await api.getOrder(this.orderNo); this.setData({ order: this.normalize(order), loading: false, error: '' }); if (order && order.status === 'paid') this.poll() }
    catch (e) { this.setData({ loading: false, error: '订单不存在或暂不可见' }) }
  },
  normalize(o) {
    return {
      ...o,
      amountText: (Number(o.paidCent || o.priceCent || 0) / 100).toFixed(2),
      routeValueText: (Number(o.routeValueCent || 0) / 100).toFixed(2),
      payChannelText: o.payChannel === 'mock' ? '模拟支付' : (o.payChannel || '待模拟支付'),
      statusText: ({ pending_pay: '待支付', paid: '开盒准备中', opened: '已完成', cancelled: '已取消', refunded: '已退款' }[o.status] || o.status),
    }
  },
  poll() { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 2000) },
  async pay() {
    if (this.data.paying) return
    this.setData({ paying: true })
    try {
      const result = await api.payOrder(this.orderNo)
      if (!result || !result.mock) throw new Error('当前环境未开启模拟支付')
      await this.startUnboxAnimation()
    } catch (e) { wx.showToast({ title: e.message || '模拟支付失败，请重试', icon: 'none' })
    } finally { this.setData({ paying: false }) }
  },
  async startUnboxAnimation() {
    const fresh = await api.getOrder(this.orderNo)
    const statuses = ['正在验证订单信息', '正在摇匀候选目的地', '正在匹配你的主题线路', '路线卡即将揭晓']
    let index = 0
    this.setData({
      order: this.normalize(fresh),
      unboxVisible: true,
      unboxStage: 'opening',
      unboxStatus: statuses[0],
    })
    if (this.unboxStatusTimer) clearInterval(this.unboxStatusTimer)
    this.unboxStatusTimer = setInterval(() => {
      index = Math.min(index + 1, statuses.length - 1)
      this.setData({ unboxStatus: statuses[index] })
    }, 650)
    if (this.unboxTimer) clearTimeout(this.unboxTimer)
    this.unboxTimer = setTimeout(() => {
      clearInterval(this.unboxStatusTimer)
      this.unboxStatusTimer = null
      this.setData({ unboxStage: 'result' })
    }, 2800)
  },
  closeUnbox() { this.setData({ unboxVisible: false }) },
  noop() {},
  async cancel() { try { await api.cancelOrder(this.orderNo); wx.showToast({ title: '订单已取消', icon: 'none' }); this.load() } catch (e) {} },
  openTrip() {
    const tripId = this.data.order && this.data.order.tripId
    if (!tripId) return wx.showToast({ title: '行程正在生成，请稍后查看', icon: 'none' })
    this.setData({ unboxVisible: false })
    wx.navigateTo({ url: '/pages/trips/detail?id=' + tripId })
  },
  openRefund() { wx.navigateTo({ url: '/pages/refunds/apply?orderNo=' + encodeURIComponent(this.orderNo) }) },
})
