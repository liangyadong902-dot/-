const api = require('../../services/api')
const store = require('../../utils/tuge-store')

const ANCHORS = [
  { id: 'guideRoute', label: '行程' },
  { id: 'guideTransit', label: '交通' },
  { id: 'guideBudget', label: '费用' },
  { id: 'guidePrepare', label: '准备' },
  { id: 'guideKnow', label: '须知' }
]

function asText(value) {
  if (!value) return ''
  if (typeof value === 'object') return value.description || value.text || value.title || ''
  return String(value)
}

function rows(value, map) {
  return Array.isArray(value) ? value.map(map).filter((item) => Array.isArray(item) ? item[0] || item[1] : item.title || item.desc) : []
}

function buildConfig(guide) {
  if (!guide || typeof guide !== 'object') throw new Error('guide_missing')
  return {
    duration: guide.durationText || '', pace: guide.paceText || '', transit: guide.transitText || '', season: guide.season || '',
    weather: asText(guide.weather), facts: Array.isArray(guide.facts) ? guide.facts.map((item) => [item.label || '', item.value || '']).filter((row) => row[0] && row[1]) : [],
    summary: guide.overview || '',
    schedule: Array.isArray(guide.schedules) ? guide.schedules.map((item) => ({
      dayNo: Number(item.dayNo || 1),
      time: item.time || '',
      title: item.title || '行程安排',
      desc: item.description || '',
      addr: item.addr || '',
      tip: item.tip || ''
    })) : [],
    transitRows: rows(guide.transport, (item) => [item.title || item.name || '交通安排', item.description || item.desc || '']),
    costs: Array.isArray(guide.budgetItems) ? guide.budgetItems.map((item) => [item.name || '费用', item.amount == null ? '以订单为准' : '¥' + Number(item.amount).toFixed(2)]) : [],
    packing: Array.isArray(guide.checklist) ? guide.checklist.map(String) : [],
    planB: guide.planB ? [['备选方案', asText(guide.planB)]] : [],
    tips: Array.isArray(guide.safetyTips) ? guide.safetyTips.map(String) : [],
    spots: Array.isArray(guide.spots) ? guide.spots.map((item) => ({
      name: item.name || '沿途景点',
      duration: item.durationMinutes ? '建议游玩 ' + item.durationMinutes + ' 分钟' : '详见现场安排',
      highlights: item.highlights || '',
      notice: item.notice || '',
      addr: item.addr || '',
      cover: item.coverUrl || ''
    })) : [],
    dining: rows(guide.dining, (item) => ({ title: item.title || '餐饮安排', desc: item.description || item.desc || '', addr: item.addr || '' })),
    lodging: rows(guide.lodging, (item) => [item.title || '住宿安排', item.description || item.desc || '']),
    rules: rows(guide.rules, (item) => [item.title || '预约规则', item.description || item.desc || '']),
    faqs: Array.isArray(guide.faqs) ? guide.faqs.map((item) => [item.question || '常见问题', item.answer || '']).filter((row) => row[1]) : []
  }
}

function firstImage(box) {
  if (!box) return ''
  return (box.imageUrls && box.imageUrls[0]) || box.coverUrl || ''
}

Page({
  data: {
    loading: true,
    error: '',
    anchors: ANCHORS,
    activeAnchor: 0,
    saved: false,
    previewOnly: false,
    img: '',
    kicker: '',
    title: '',
    place: '',
    metas: [],
    weather: '',
    facts: [],
    routeLabel: '',
    summary: '',
    scheduleDays: [],
    multiDay: false,
    transitRows: [],
    costs: [],
    checks: [],
    planB: [],
    tips: [],
    spots: [],
    diningRows: [],
    lodgingRows: [],
    rules: [],
    faqs: []
  },

  onLoad(options) {
    if (options.boxId) this.loadProduct(options.boxId)
    else if (options.tripId) this.loadTrip(options.tripId)
    else this.setData({ loading: false, error: '攻略暂时无法打开' })
  },

  async loadProduct(boxId) {
    try {
      const box = await api.getBox(boxId)
      const guide = box.guidePreview && typeof box.guidePreview === 'object' ? box.guidePreview : {}
      const config = buildConfig(guide)
      this.render(config, {
        kind: 'product',
        title: (box.name || '主题盲盒') + '出行攻略',
        place: '目的地将在开盒后揭晓',
        img: firstImage(box),
        moodText: '',
        price: Number(box.price || 0),
        value: Number(box.minValue || 0)
      })
    } catch (e) {
      this.setData({ loading: false, error: '攻略暂时无法打开' })
    }
  },

  async loadTrip(tripId) {
    try {
      const trip = await api.getTrip(tripId)
      let img = ''
      if (trip.boxId) {
        try { img = firstImage(await api.getBox(trip.boxId)) } catch (e) {}
      }
      let guide = null
      try { guide = await api.getTripGuide(tripId) } catch (e) {}
      const config = buildConfig(guide)
      this.render(config, {
        kind: 'trip',
        title: trip.routeName || '行程攻略',
        place: trip.location || '目的地',
        img,
        moodText: trip.moodText || '',
        price: Number(trip.priceCent || 0) / 100,
        value: Number(trip.valueCent || 0) / 100
      })
    } catch (e) {
      this.setData({ loading: false, error: '攻略暂时无法打开' })
    }
  },

  render(config, meta) {
    const firstCost = meta.kind === 'trip'
      ? ['已购行程', '购入 ¥' + meta.price + ' · 票面 ¥' + meta.value]
      : ['盲盒权益', '开盒 ¥' + meta.price + ' · 含行程攻略']
    const dayNos = Array.from(new Set(config.schedule.map((item) => item.dayNo))).sort((a, b) => a - b)
    const scheduleDays = dayNos.map((dayNo) => ({
      dayNo,
      stops: config.schedule.filter((item) => item.dayNo === dayNo)
    }))
    this.setData({
      loading: false,
      error: '',
      previewOnly: meta.kind === 'product',
      img: meta.img,
      kicker: meta.kind === 'trip' ? '路线攻略 · 已解锁' : '主题攻略 · 开盒前',
      title: meta.title,
      place: meta.place,
      metas: [config.duration, config.pace, config.transit, config.season].filter(Boolean),
      weather: config.weather,
      facts: config.facts.map((row) => ({ label: row[0], value: row[1] })),
      routeLabel: config.duration ? config.duration + ' 建议安排' : (meta.kind === 'product' ? '开盒后揭晓' : '以订单为准'),
      summary: meta.moodText ? meta.moodText + '。' + config.summary : config.summary,
      scheduleDays,
      multiDay: scheduleDays.length > 1,
      transitRows: config.transitRows.map((row) => ({ title: row[0], desc: row[1] })),
      costs: [firstCost].concat(config.costs).map((row) => ({ label: row[0], value: row[1] })),
      checks: config.packing.map((text) => ({ text, done: false })),
      planB: config.planB.map((row) => ({ label: row[0], text: row[1] })),
      tips: config.tips.map((text, index) => ({ no: String(index + 1).padStart(2, '0'), text })),
      spots: config.spots || [],
      diningRows: config.dining || [],
      lodgingRows: (config.lodging || []).map((row) => ({ title: row[0], desc: row[1] })),
      rules: (config.rules || []).map((row) => ({ title: row[0], desc: row[1] })),
      faqs: (config.faqs || []).map((row, index) => ({ no: String(index + 1).padStart(2, '0'), question: row[0], answer: row[1] }))
    })
  },

  jumpAnchor(e) {
    const id = e.currentTarget.dataset.id
    const index = Number(e.currentTarget.dataset.index)
    this.setData({ activeAnchor: index })
    const q = wx.createSelectorQuery()
    q.select('#' + id).boundingClientRect()
    q.selectViewport().scrollOffset()
    q.exec((res) => {
      const rect = res && res[0]
      const scroll = res && res[1]
      if (!rect || !scroll) return
      wx.pageScrollTo({
        scrollTop: Math.max(0, scroll.scrollTop + rect.top - 112),
        duration: 260
      })
    })
  },

  toggleCheck(e) {
    const index = Number(e.currentTarget.dataset.index)
    const key = 'checks[' + index + '].done'
    this.setData({ [key]: !this.data.checks[index].done })
  },

  toggleSave() {
    const saved = !this.data.saved
    this.setData({ saved })
    wx.showToast({ title: saved ? '攻略已收藏' : '已取消收藏', icon: 'none' })
  },

  askAi() {
    const prompt = '请根据「' + this.data.title + '」帮我检查行前准备，并提醒最容易遗漏的三件事。'
    store.sendUserMessage(prompt)
    wx.navigateTo({ url: '/pages/ai/index' })
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
  }
})
