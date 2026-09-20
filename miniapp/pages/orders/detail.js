const api = require('../../services/api')

Page({
  data: { order: null, loading: true, error: '', paying: false, payment: null, paymentVisible: false },
  onLoad(options) { this.orderNo = decodeURIComponent(options.orderNo || ''); this.load() },
  onUnload() { if (this.timer) clearTimeout(this.timer) },
  async load() {
    try { const order = await api.getOrder(this.orderNo); this.setData({ order: this.normalize(order), loading: false, error: '' }); if (order && order.status === 'paid') this.poll() }
    catch (e) { this.setData({ loading: false, error: '订单不存在或暂不可见' }) }
  },
  normalize(o) { return { ...o, amountText: (Number(o.paidCent || o.priceCent || 0) / 100).toFixed(2), routeValueText: (Number(o.routeValueCent || 0) / 100).toFixed(2), statusText: ({ pending_pay: '待支付', paid: '开盒准备中', opened: '已完成', cancelled: '已取消', refunded: '已退款' }[o.status] || o.status) } },
  poll() { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 2000) },
  async pay() {
    if (this.data.paying) return
    this.setData({ paying: true })
    try {
      const result = await api.payOrder(this.orderNo)
      if (result && result.mock) { wx.showToast({ title: '支付成功，开始开盒', icon: 'none' }); await this.load(); return }
      if (!result) throw new Error('支付信息为空')
      const payment = { payUrl: result.payUrl || '', qrCode: '', hasForm: !!result.payForm }
      if (result.qrCodeBase64) payment.qrCode = await this.saveQrCode(result.qrCodeBase64)
      else if (result.qrCodeUrl) payment.qrCode = result.qrCodeUrl
      this.setData({ payment, paymentVisible: true })
      if (payment.payUrl) wx.setClipboardData({ data: payment.payUrl, showToast: false })
    } catch (e) { wx.showToast({ title: '暂时无法生成支付信息', icon: 'none' })
    } finally { this.setData({ paying: false }) }
  },
  saveQrCode(value) {
    return new Promise((resolve, reject) => {
      const base64 = String(value).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
      const filePath = `${wx.env.USER_DATA_PATH}/alipay-${this.orderNo}.png`
      wx.getFileSystemManager().writeFile({ filePath, data: base64, encoding: 'base64', success: () => resolve(filePath), fail: reject })
    })
  },
  closePayment() { this.setData({ paymentVisible: false }) },
  copyPayUrl() { const url = this.data.payment && this.data.payment.payUrl; if (url) wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '链接已复制，请用外部浏览器打开', icon: 'none' }) }) },
  async cancel() { try { await api.cancelOrder(this.orderNo); wx.showToast({ title: '订单已取消', icon: 'none' }); this.load() } catch (e) {} },
  openTrip() { const tripId = this.data.order && this.data.order.tripId; if (tripId) wx.navigateTo({ url: '/pages/trips/detail?id=' + tripId }) },
  openRefund() { wx.navigateTo({ url: '/pages/refunds/apply?orderNo=' + encodeURIComponent(this.orderNo) }) },
})
