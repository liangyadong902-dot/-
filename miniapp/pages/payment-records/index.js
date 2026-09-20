const api = require('../../services/api')
Page({
  data: { records: [], loading: true, error: '', empty: false },
  onShow() { this.load() },
  async load() { try { const result = await api.listPaymentRecords({ page: 1, pageSize: 50 }); const records = ((result && result.list) || []).map(item => ({ ...item, amountText: Number(item.amount || Number(item.amountCent || 0) / 100).toFixed(2) })); this.setData({ records, loading: false, empty: !records.length }) } catch (e) { this.setData({ loading: false, error: '支付记录暂时无法加载' }) } },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()) },
})
