const api = require('../../services/api')
Page({
  data: { refund: null, loading: true, error: '' },
  onLoad(options) { this.orderNo = decodeURIComponent(options.orderNo || ''); this.load() },
  async load() { try { const result = await api.listRefunds({ page: 1, pageSize: 50 }); const refund = (result && result.list || []).find(item => item.orderNo === this.orderNo); if (!refund) throw new Error('not found'); refund.amountText = Number(refund.amount || Number(refund.amountCent || 0) / 100).toFixed(2); this.setData({ refund, loading: false }) } catch (e) { this.setData({ loading: false, error: '退款单暂未同步，稍后再试' }) } },
})
