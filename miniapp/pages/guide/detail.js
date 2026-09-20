const api = require('../../services/api')
const store = require('../../utils/tuge-store')

/* 主题攻略模板 — 对照 index-app-latest.html GUIDE_CONFIGS */
const GUIDE_CONFIGS = {
  nearby: {
    duration: '1 天', pace: '轻松慢游', transit: '集合接驳', season: '四季可行',
    weather: '出发前一天确认降雨和集合时间。古村、茶山路面雨后较滑，建议穿防滑鞋。',
    facts: [['适合人群', '独行、朋友、轻家庭'], ['步行强度', '约 6–9 千步'], ['集合时间', '通常 08:00–09:00'], ['返程时间', '预计 17:30 前']],
    summary: '一天线路不追求赶景点，把核心体验、午餐和自由散步拆开，给情绪留一点空白。',
    schedule: [['08:30', '集合与出发', '核验订单、确认返程点与同行人。'], ['10:00', '抵达核心体验区', '跟随向导完成主要景观或非遗体验。'], ['12:30', '当地午餐', '按订单权益用餐，特殊饮食提前说明。'], ['14:00', '慢游与自由记录', '保留自由散步、拍照和休息时间。'], ['17:00', '集合返程', '清点随身物品，按统一车辆返回。']],
    transitRows: [['集合接驳', '具体集合点在开盒后展示，建议提前 15 分钟抵达。'], ['当地步行', '核心区域以步行为主，穿防滑且已磨合的鞋。']],
    costs: [['盲盒权益', '交通、向导及页面标明体验'], ['建议自备', '¥50–100 餐饮与个人消费']],
    packing: ['身份证件', '充电宝', '防滑步行鞋', '轻便雨具', '饮用水', '常用药品'],
    planB: [['小雨', '调整为室内展陈、手作或街巷慢游。'], ['大雨', '以安全为先缩短户外段，按通知调整。']],
    tips: ['不要提前购买不可退改的衔接交通。', '未经许可不进入村民院落或非开放区域。', '返程前确认集合点，不临时离队。']
  },
  province: {
    duration: '2 天 1 夜', pace: '舒展深度', transit: '大巴往返', season: '春秋优先',
    weather: '山区温差明显，天气可能快速变化。请准备薄外套和雨具，以景区当日开放为准。',
    facts: [['适合人群', '朋友、伴侣、轻户外'], ['步行强度', '每日约 1.2 万步'], ['住宿标准', '当地标准间'], ['返程时间', 'D2 18:00 左右']],
    summary: '两日行程把核心景观与休息时间拆开，避免单日过度奔波，适合想看风景也想慢下来的旅行者。',
    schedule: [['D1 08:00', '集合出发', '核验身份与订单，统一乘车前往目的地。'], ['D1 13:00', '核心景区上行', '根据天气选择索道或开放步道。'], ['D1 18:00', '入住与晚餐', '确认次日早餐、集合时间和行李安排。'], ['D2 06:30', '晨间观景', '按体力选择日出或轻量步道。'], ['D2 15:30', '返程集合', '预留换乘余量，统一返程。']],
    transitRows: [['往返大巴', '出发前一天发布车牌、领队和最终集合点。'], ['景区交通', '索道、接驳车开放与否以当日公告为准。']],
    costs: [['盲盒权益', '往返交通、住宿及基础门票'], ['建议自备', '¥150–300 餐饮与个人消费']],
    packing: ['身份证件', '外套', '防滑鞋', '雨具', '洗漱用品', '少量能量食品'],
    planB: [['索道停运', '切换低海拔开放步道和室内文化点。'], ['极端天气', '优先保障住宿与返程，权益按通知处理。']],
    tips: ['不进入封闭步道，不翻越护栏。', '住宿升级与单房差需在出发前确认。', '高处观景时保管好手机和随身物品。']
  },
  cross: {
    duration: '3 天 2 夜', pace: '松弛探索', transit: '大交通自理', season: '按目的地',
    weather: '跨省线路请同时查看出发地与目的地天气；高原、沿海等区域需额外关注温差和紫外线。',
    facts: [['适合人群', '成人独行或结伴'], ['步行强度', '每日约 8–12 千步'], ['住宿标准', '2 晚当地住宿'], ['行李建议', '20 寸内轻装']],
    summary: '三天线路保留一段自由时间，抵达日不排高强度活动，返程日留足大交通换乘余量。',
    schedule: [['D1 下午', '抵达与入住', '先确认接驳点和酒店信息，晚间就近活动。'], ['D2 09:00', '目的地核心体验', '完成主景观与主题体验，中途安排补给。'], ['D2 17:00', '自由时间', '根据体力选择餐食、散步或提前休息。'], ['D3 09:30', '城市慢游', '安排轻量游览和伴手礼时间。'], ['D3 14:00', '返程换乘', '航班提前 2 小时、高铁提前 45 分钟抵达。']],
    transitRows: [['大交通', '目的地确认后再购票，优先选择可退改班次。'], ['当地接驳', '车辆与集合信息通常在出发前一天发布。']],
    costs: [['盲盒权益', '当地住宿、接驳和主行程'], ['需要自理', '往返大交通与自由活动消费']],
    packing: ['身份证件', '充电设备', '分层衣物', '防晒用品', '常用药品', '离线订单截图'],
    planB: [['班次延误', '保留延误凭证并联系订单客服。'], ['极端天气', '主行程暂停时优先保障住宿与返程。']],
    tips: ['确认目的地前不要锁定不可退改票务。', '核对证件姓名与交通订单完全一致。', '自由活动使用正规平台叫车。']
  },
  theme: {
    duration: '1 天', pace: '边走边尝', transit: '城市公共交通', season: '全年可行',
    weather: '城市步行线路受高温和降雨影响较大，夏季注意防晒补水，雨天优先骑楼与室内展陈。',
    facts: [['适合人群', '朋友、亲子、美食爱好者'], ['步行强度', '约 8–10 千步'], ['体验方式', '少量多次品尝'], ['结束时间', '预计 18:00 前']],
    summary: '主题线路围绕城市街区、饮食与在地文化展开，不追求打卡数量，重点理解一座城的日常脉络。',
    schedule: [['09:00', '当地早餐体验', '确认权益套餐和过敏信息，小份分享。'], ['10:30', '街区文化慢游', '观察建筑、水系与社区生活。'], ['12:30', '主题午餐', '按线路安排体验代表性餐食。'], ['14:30', '展陈或非遗体验', '以现场开放和预约时段为准。'], ['17:00', '自由散步与返程', '购买伴手礼前评估保存与返程时间。']],
    transitRows: [['城市交通', '优先地铁与步行，避开高峰拥堵路段。'], ['集合方式', '首站集合，结束后可就近解散。']],
    costs: [['盲盒权益', '主题餐食、讲解与体验项目'], ['建议自备', '¥80–150 个人加餐与交通']],
    packing: ['轻便鞋', '折叠伞', '纸巾', '充电宝', '饮用水', '过敏信息卡'],
    planB: [['降雨', '转入骑楼、展馆或室内非遗点。'], ['热门店排队', '启用同类型备选店，保障体验节奏。']],
    tips: ['过敏信息需向领队和店家重复确认。', '社区街巷不阻挡居民通行。', '购买冷藏食品前确认返程时长。']
  }
}

const ANCHORS = [
  { id: 'guideRoute', label: '行程' },
  { id: 'guideTransit', label: '交通' },
  { id: 'guideBudget', label: '费用' },
  { id: 'guidePrepare', label: '准备' },
  { id: 'guideKnow', label: '须知' }
]

function buildConfig(category, guide) {
  const fallback = GUIDE_CONFIGS[category] || GUIDE_CONFIGS.nearby
  if (!guide || !Array.isArray(guide.schedules)) return fallback
  const transitRows = (guide.transport || [])
    .map((item) => [item.title || item.name || '交通安排', item.description || ''])
    .concat((guide.dining || []).map((item) => [item.title || '餐饮安排', item.description || '']))
  const costs = (guide.budgetItems || []).map((item) => [item.name, '¥' + Number(item.amount || 0).toFixed(2)])
  return Object.assign({}, fallback, {
    duration: guide.durationText || fallback.duration,
    summary: guide.overview || fallback.summary,
    schedule: guide.schedules.map((item) => [item.time || ('D' + (item.dayNo || 1)), item.title || '行程安排', item.description || '']),
    transitRows: transitRows.length ? transitRows : fallback.transitRows,
    costs: costs.length ? costs : fallback.costs,
    packing: guide.checklist && guide.checklist.length ? guide.checklist : fallback.packing,
    planB: guide.planB ? [['备选方案', guide.planB]] : fallback.planB,
    tips: guide.safetyTips && guide.safetyTips.length ? guide.safetyTips : fallback.tips
  })
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
    img: '',
    kicker: '',
    title: '',
    place: '',
    metas: [],
    weather: '',
    facts: [],
    routeLabel: '',
    summary: '',
    schedule: [],
    transitRows: [],
    costs: [],
    checks: [],
    planB: [],
    tips: []
  },

  onLoad(options) {
    if (options.boxId) this.loadProduct(options.boxId)
    else if (options.tripId) this.loadTrip(options.tripId)
    else this.setData({ loading: false, error: '攻略暂时无法打开' })
  },

  async loadProduct(boxId) {
    try {
      const box = await api.getBox(boxId)
      const guide = box.guidePreview && Array.isArray(box.guidePreview.schedules) ? box.guidePreview : null
      const config = buildConfig(box.category, guide)
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
      const config = buildConfig(trip.boxCategory, guide)
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
      : ['盲盒权益', '开盒 ¥' + meta.price + ' · 保底 ≥ ¥' + meta.value]
    this.setData({
      loading: false,
      error: '',
      img: meta.img,
      kicker: meta.kind === 'trip' ? 'ROUTE GUIDE · 已解锁' : 'THEME GUIDE · 开盒前',
      title: meta.title,
      place: meta.place,
      metas: [config.duration, config.pace, config.transit, config.season],
      weather: config.weather,
      facts: config.facts.map((row) => ({ label: row[0], value: row[1] })),
      routeLabel: config.duration + ' 建议安排',
      summary: meta.moodText ? meta.moodText + '。' + config.summary : config.summary,
      schedule: config.schedule.map((row) => ({ time: row[0], title: row[1], desc: row[2] })),
      transitRows: config.transitRows.map((row) => ({ title: row[0], desc: row[1] })),
      costs: [firstCost].concat(config.costs).map((row) => ({ label: row[0], value: row[1] })),
      checks: config.packing.map((text) => ({ text, done: false })),
      planB: config.planB.map((row) => ({ label: row[0], text: row[1] })),
      tips: config.tips.map((text, index) => ({ no: String(index + 1).padStart(2, '0'), text }))
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
    wx.switchTab({ url: '/pages/ai/index' })
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
  }
})
