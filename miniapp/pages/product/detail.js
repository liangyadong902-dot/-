const api = require('../../services/api')

const SAVED_KEY = 'tuge-saved-boxes'

Page({
  data: { box: null, loading: true, error: '', saved: false },
  onLoad(options) { this.id = options.id; this.load() },
  async load() {
    try {
      const box = await api.getBox(this.id)
      box.gallery = box.imageUrls && box.imageUrls.length ? box.imageUrls : [box.coverUrl]
      box.hasMultipleImages = box.gallery.length > 1
      box.guidePreview = box.guidePreview || {}
      box.includes = box.includes && box.includes.length ? box.includes : []
      box.ratePercent = Math.max(100, Math.round((Number(box.minValue || 0) / Number(box.price || 1)) * 100))
      const saved = (wx.getStorageSync(SAVED_KEY) || []).indexOf(String(this.id)) >= 0
      this.setData({ box, saved, loading: false, error: '' })
    } catch (e) {
      this.setData({ loading: false, error: '商品不存在或暂时无法加载' })
    }
  },
  goBack() { wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) }) },
  openGuide() { wx.navigateTo({ url: '/pages/guide/detail?boxId=' + this.id }) },
  toggleSave() {
    const list = wx.getStorageSync(SAVED_KEY) || []
    const index = list.indexOf(String(this.id))
    if (index >= 0) list.splice(index, 1)
    else list.push(String(this.id))
    wx.setStorageSync(SAVED_KEY, list)
    this.setData({ saved: index < 0 })
    wx.showToast({ title: index >= 0 ? '已取消收藏' : '已收藏盲盒', icon: 'none' })
  },
  async addCart() {
    if (!this.data.box || this.data.box.status !== 'on') return
    try {
      await api.addCartItem(Number(this.id), 1)
      wx.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (e) {}
  },
  async buy() {
    if (!this.data.box || this.data.box.status !== 'on') return
    try {
      const order = await api.createOrder(Number(this.id))
      wx.navigateTo({ url: '/pages/orders/detail?orderNo=' + order.orderNo })
    } catch (e) {}
  },
})
