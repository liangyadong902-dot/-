const api = require('../../services/api')

function firstImage(box) {
  return box && ((box.imageUrls && box.imageUrls[0]) || box.coverUrl) || ''
}

function normalizeRows(rows, fallback) {
  if (!Array.isArray(rows) || !rows.length) return fallback
  return rows.map((item) => ({ time: item.time || ('D' + (item.dayNo || 1)), title: item.title || '行程安排', desc: item.description || '' }))
}

function formatDuration(minutes) {
  const value = Number(minutes)
  if (!Number.isFinite(value) || value <= 0) return '建议慢游'
  if (value < 60) return value + ' 分钟'
  const hours = value / 60
  return (Number.isInteger(hours) ? hours : hours.toFixed(1)) + ' 小时'
}

function normalizeTextRows(rows, title) {
  if (!Array.isArray(rows)) return []
  return rows.map((item) => ({
    title: (item && (item.title || item.name)) || title,
    desc: (item && (item.description || item.desc || item.highlights || item.notice)) || ''
  })).filter((item) => item.title || item.desc)
}

function normalizePlanB(value) {
  if (Array.isArray(value)) {
    return value.map((item) => ({
      label: (item && (item.label || item.title || item.name)) || '备选方案',
      text: (item && (item.text || item.description || item.desc)) || String(item || '')
    })).filter((item) => item.text)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).map((key) => ({ label: key, text: String(value[key] || '') })).filter((item) => item.text)
  }
  return value ? [{ label: '天气 / 调整', text: String(value) }] : []
}

function normalizeWeather(value) {
  if (!value) return ''
  if (typeof value === 'object') return value.description || value.text || value.title || ''
  return String(value)
}

function normalizeFacts(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((item) => ({ label: item && item.label || '', value: item && item.value || '' })).filter((item) => item.label && item.value)
}

function formatCost(item) {
  if (!item) return { label: '费用', value: '' }
  const raw = item.amount != null ? item.amount : (item.amountYuan != null ? item.amountYuan : item.value)
  const amount = Number(raw)
  const value = Number.isFinite(amount) ? '¥' + amount.toFixed(2) : String(raw || '以订单为准')
  return { label: item.name || item.title || '费用', value, note: item.required ? '建议预留' : '可选' }
}

function cleanDiary(value) {
  return String(value || '').replace(/\s*——\s*AI\s*生成\s*$/i, '').trim()
}

Page({
  data: { trip: null, loading: true, error: '', diaryLoading: false },
  onLoad(options) { this.id = options.id; this.load() },
  async load() {
    try {
      const trip = await api.getTrip(this.id)
      let guide = null
      let cover = ''
      try { guide = await api.getTripGuide(this.id) } catch (e) {}
      if (trip.boxId) {
        try { cover = firstImage(await api.getBox(trip.boxId)) } catch (e) {}
      }
      this.setData({ trip: this.normalize(trip, guide, cover), loading: false, error: '' })
    } catch (e) {
      this.setData({ loading: false, error: '行程不存在或已失效' })
    }
  },
  normalize(t, guide, cover) {
    const source = guide || {}
    const schedules = normalizeRows(source.schedules, [])
    const remoteSpots = Array.isArray(source.spots) ? source.spots : []
    const spots = remoteSpots.length
      ? remoteSpots.map((item) => ({ name: item.name || t.location, duration: formatDuration(item.durationMinutes), desc: item.highlights || item.notice || '' }))
      : []
    const includes = Array.isArray(t.includeList) ? t.includeList : []
    const transportRows = normalizeTextRows(source.transport, '交通安排')
    const diningRows = normalizeTextRows(source.dining, '餐饮安排')
    const lodgingRows = normalizeTextRows(source.lodging, '住宿安排')
    const costs = Array.isArray(source.budgetItems) ? source.budgetItems.map(formatCost).filter((item) => item.value) : []
    const checklist = Array.isArray(source.checklist) && source.checklist.length ? source.checklist.map(String) : includes
    const planB = normalizePlanB(source.planB)
    const safetyTips = Array.isArray(source.safetyTips) ? source.safetyTips.map(String).filter(Boolean) : []
    const rules = normalizeTextRows(source.rules, '出行规则')
    const faqs = Array.isArray(source.faqs) ? source.faqs.map((item) => ({ question: item.question || '常见问题', answer: item.answer || '' })).filter((item) => item.answer) : []
    const facts = normalizeFacts(source.facts)
    return {
      ...t, cover,
      highlight: t.highlight || source.overview || '',
      diaryText: cleanDiary(t.diaryText),
      priceText: (Number(t.priceCent || 0) / 100).toFixed(2),
      valueText: (Number(t.valueCent || 0) / 100).toFixed(2),
      validityText: t.validity === 'valid' ? '有效行程' : '已失效',
      dateText: t.openedDate || '已解锁',
      durationText: source.durationText || '',
      paceText: source.paceText || '',
      walkText: source.walkText || '',
      transitText: source.transitText || '',
      seasonText: source.season || '',
      weatherText: normalizeWeather(source.weather),
      facts, schedules, spots, includes, transportRows, diningRows, lodgingRows, costs, checklist, planB, safetyTips, rules, faqs,
      guideHint: spots.length + ' 个景点 · ' + transportRows.length + ' 段交通 · ' + costs.length + ' 项费用'
    }
  },
  openGuide() { wx.navigateTo({ url: '/pages/guide/detail?tripId=' + this.id }) },
  openCheckin() { wx.navigateTo({ url: '/pages/checkin/create?tripId=' + this.id }) },
  async diary() {
    if (this.data.diaryLoading) return
    this.setData({ diaryLoading: true })
    try {
      const result = await api.generateDiary(this.id)
      this.setData({ 'trip.diaryText': cleanDiary(result && (result.diaryText || result.text || result)) || '日记生成完成' })
    } catch (e) {
      wx.showToast({ title: '日记生成失败，请稍后重试', icon: 'none' })
    } finally { this.setData({ diaryLoading: false }) }
  }
})
