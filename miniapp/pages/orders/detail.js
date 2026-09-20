const api = require('../../services/api')

Page({
  data: { order: null, loading: true, error: '', paying: false },
  onLoad(options) { this.orderNo = decodeURIComponent(options.orderNo || ''); this.load() },
  onUnload() { if (this.timer) clearTimeout(this.timer) },
  async load() {
    try { const order = await api.getOrder(this.orderNo); this.setData({ order: this.normalize(order), loading: false, error: '' }); if (order && order.status === 'paid') this.poll() }
    catch (e) { this.setData({ loading: false, error: '订单不存在或暂不可见' }) }
  },
  normalize(o) { return { ...o, amountText: (Number(o.paidCent || o.priceCent || 0) / 100).toFixed(2), routeValueText: (Number(o.routeValueCent || 0) / 100).toFixed(2), statusText: ({ pending_pay: '待支付', paid: '开盒准备中', opened: '已完成', cancelled: '已取消', refunded: '已退款' }[o.status] || o.status) } },
  poll() { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 2000) },
  async pay() { if (this.data.paying) return; this.setData({ paying: true }); try { const result = await api.payOrder(this.orderNo); if (result && result.payUrl && result.payUrl.indexOf('mock://') !== 0) wx.setClipboardData({ data: result.payUrl }); wx.showToast({ title: result && result.mock ? '支付成功，开始开盒' : '已生成支付链接', icon: 'none' }); await this.load() } catch (e) {} finally { this.setData({ paying: false }) } },
  async cancel() { try { await api.cancelOrder(this.orderNo); wx.showToast({ title: '订单已取消', icon: 'none' }); this.load() } catch (e) {} },
  openTrip() { const tripId = this.data.order && this.data.order.tripId; if (tripId) wx.navigateTo({ url: '/pages/trips/detail?id=' + tripId }) },
  openRefund() { wx.navigateTo({ url: '/pages/refunds/apply?orderNo=' + encodeURIComponent(this.orderNo) }) },
})
