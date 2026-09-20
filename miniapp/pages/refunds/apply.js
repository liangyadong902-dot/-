const api = require('../../services/api')
Page({
  data: { orderNo: '', order: null, kind: 'unused', reason: '未出行退换 · 行程冲突', reasons: ['未出行退换 · 行程冲突', '票面价值与预期不符'], loading: true, submitting: false, error: '' },
  onLoad(options) { this.setData({ orderNo: decodeURIComponent(options.orderNo || '') }); this.load() },
  async load() { try { const order = await api.getOrder(this.data.orderNo); this.setData({ order, loading: false }) } catch (e) { this.setData({ loading: false, error: '订单无法读取' }) } },
  pickKind(e) { this.setData({ kind: e.currentTarget.dataset.kind }) },
  pickReason(e) { this.setData({ reason: e.currentTarget.dataset.reason }) },
  async submit() { if (this.data.submitting) return; this.setData({ submitting: true }); try { await api.refundOrder(this.data.orderNo, this.data.reason, this.data.kind); wx.showToast({ title: '退款申请已提交', icon: 'none' }); setTimeout(() => wx.redirectTo({ url: '/pages/refunds/detail?orderNo=' + encodeURIComponent(this.data.orderNo) }), 500) } catch (e) {} finally { this.setData({ submitting: false }) } },
})
