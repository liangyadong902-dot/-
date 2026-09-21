const api = require('../../services/api')
const makePage = require('../../behaviors/tuge-page')

// 价格档位（单位：元），与后端 price 字段比对；label 用风格名，避免数字区间太生硬
const PRICE_BANDS = [
  { key: 'p01', label: '毛毛雨', min: 0.1, max: 1 },
  { key: 'p13', label: '小确幸', min: 1.01, max: 3 },
  { key: 'p35', label: '轻装行', min: 3.01, max: 5 },
  { key: 'p510', label: '自在游', min: 5.01, max: 10 },
  { key: 'pluxe', label: '轻奢档', min: 10.01, max: Infinity },
]

Page(makePage(1, {
  data: { list: [], loading: true, category: 'all', priceBand: 'all', bands: PRICE_BANDS },
  onLoad() { this.load() },
  async load() {
    this.setData({ loading: true })
    try {
      // 一次拉全量，分类 + 价格档均在本地过滤，切换筛选不重复请求
      this.allBoxes = (await api.listBoxes({})) || []
      this.applyFilter()
    } catch (e) {
      this.allBoxes = []
      this.setData({ list: [], loading: false })
    }
  },
  applyFilter() {
    const { category, priceBand } = this.data
    const band = PRICE_BANDS.find((b) => b.key === priceBand)
    const list = (this.allBoxes || []).filter((box) => {
      if (category !== 'all' && box.category !== category) return false
      if (band && (!(box.price >= band.min) || !(box.price <= band.max))) return false
      return true
    })
    this.setData({ list, loading: false })
  },
  filter(e) {
    this.setData({ category: e.currentTarget.dataset.category }, () => this.applyFilter())
  },
  pickBand(e) {
    const key = e.currentTarget.dataset.band
    // 再点一次取消档位筛选
    this.setData({ priceBand: this.data.priceBand === key ? 'all' : key }, () => this.applyFilter())
  },
  open(e) {
    wx.navigateTo({ url: '/pages/product/detail?id=' + e.currentTarget.dataset.id })
  },
}))
