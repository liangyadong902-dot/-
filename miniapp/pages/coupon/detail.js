const api = require('../../services/api')
const { createRequestId } = require('../../utils/request-id')
Page({
  data: { id: null, item: null, loading: true, error: '', using: false, used: false },
  onLoad(options) { this.id = options.id; this.load() },
  async load() { this.setData({ loading: true, error: '' }); try { const item = await api.getMyCoupon(this.id); this.setData({ item, loading: false }) } catch (e) { this.setData({ loading: false, error: '详情加载失败' }) } },
  use() {
    if (!this.data.item || this.data.using) return
    wx.showModal({ title: '确认使用', content: '使用后不可撤销', success: (res) => { if (res.confirm) this.doUse() } })
  },
  async doUse() { this.setData({ using: true }); try { await api.useMyCoupon(this.data.item.id, this.data.item.verifyCode, createRequestId('USE')); this.setData({ used: true }); this.load() } catch (e) { } finally { this.setData({ using: false }) } },
  retry() { this.load() },
})
