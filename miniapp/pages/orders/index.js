const api = require('../../services/api')

Page({
  data: { tabs: [{ key: '', label: '全部' }, { key: 'pending_pay', label: '待支付' }, { key: 'paid', label: '待开盒' }, { key: 'opened', label: '已开盒' }, { key: 'refunded', label: '退款' }], active: '', orders: [], loading: true, empty: false, error: '' },
  onLoad(options) { this.setData({ active: options.status || '' }); this.load() },
  onShow() { if (this.data.orders.length) this.load() },
  async load() {
    this.setData({ loading: true, error: '' })
    try { const result = await api.listOrders({ status: this.data.active || undefined, page: 1, pageSize: 50 }); const orders = (result && result.list || []).map(this.normalize); this.setData({ orders, loading: false, empty: !orders.length }) }
    catch (e) { this.setData({ loading: false, error: '订单暂时无法加载，请稍后重试' }) }
  },
  normalize(order) { return { ...order, amountText: (Number(order.paidCent || order.priceCent || 0) / 100).toFixed(2), statusText: ({ pending_pay: '待支付', paid: '抽取中', opened: '已开盒', cancelled: '已取消', refunded: '已退款' }[order.status] || order.status) } },
  switchTab(e) { const active = e.currentTarget.dataset.key; this.setData({ active }); this.load() },
  openOrder(e) { wx.navigateTo({ url: '/pages/orders/detail?orderNo=' + encodeURIComponent(e.currentTarget.dataset.no) }) },
  goMarket() { wx.navigateTo({ url: '/pages/market/index' }) },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()) },
})
