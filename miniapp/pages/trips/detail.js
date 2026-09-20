const api = require('../../services/api')
Page({
  data: { trip: null, loading: true, error: '', diaryLoading: false },
  onLoad(options) { this.id = options.id; this.load() },
  async load() { try { const trip = await api.getTrip(this.id); this.setData({ trip: this.normalize(trip), loading: false }) } catch (e) { this.setData({ loading: false, error: '行程不存在或已失效' }) } },
  normalize(t) { return { ...t, priceText: (Number(t.priceCent || 0) / 100).toFixed(2), valueText: (Number(t.valueCent || 0) / 100).toFixed(2), validityText: t.validity === 'valid' ? '有效行程' : '已失效' } },
  openGuide() { wx.navigateTo({ url: '/pages/guide/detail?tripId=' + this.id }) },
  openCheckin() { wx.navigateTo({ url: '/pages/checkin/create?tripId=' + this.id }) },
  async diary() { this.setData({ diaryLoading: true }); try { const result = await api.generateDiary(this.id); this.setData({ 'trip.diaryText': result && (result.diaryText || result.text || result) || '日记生成完成' }) } catch (e) {} finally { this.setData({ diaryLoading: false }) } },
})
