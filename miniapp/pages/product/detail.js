const api = require('../../services/api')
const { fetchDisplayMediaList, resolveMedia } = require('../../utils/request')

const SAVED_KEY = 'tuge-saved-boxes'

const CATEGORY_LABELS = {
  nearby: '周边游',
  province: '省内游',
  cross: '跨省游',
  theme: '主题专线',
  guide: '纯攻略',
}

const SCENE_LABELS = {
  ancient_town: '古镇', village: '古村', mountain: '山野', lake: '湖畔', seaside: '海边',
  island: '海岛', city_walk: '城市漫步', camping: '露营', hot_spring: '温泉', theme_park: '乐园',
  night_view: '夜色', food: '觅食', museum: '展馆', countryside: '田园', grassland: '草原',
  desert: '大漠', snow: '冰雪', forest: '森林',
}

const MOOD_LABELS = {
  bored: '无聊想逃', emo: 'emo了', happy: '开心出逃', weekend: '周末就走', holiday: '假期去哪',
  tired: '累了想躺', miss: '想出门透透气', celebrate: '庆祝一下', relax: '想放空', explore: '想探险',
}

Page({
  data: { box: null, loading: true, error: '', saved: false },
  onLoad(options) { this.id = options.id; this.load() },
  async load() {
    try {
      const box = await api.getBox(this.id)
      box.gallery = box.imageUrls && box.imageUrls.length ? box.imageUrls : [box.coverUrl]
      box.guidePreview = box.guidePreview || {}
      box.includes = box.includes && box.includes.length ? box.includes : []
      box.moods = Array.isArray(box.moods) ? box.moods : []
      box.scenes = Array.isArray(box.scenes) ? box.scenes : []
      box.moods = box.moods.map((m) => MOOD_LABELS[m] || m)
      const sceneName = (s) => SCENE_LABELS[s] || s
      box.tag = box.tag || CATEGORY_LABELS[box.category] || '旅行盲盒'
      const RANK_LABELS = { TOP1: '人气第1', TOP2: '热卖第2', TOP3: '精选第3', HOT: '热门', NEW: '新上架' }
      box.rankTag = RANK_LABELS[box.rankTag] || box.rankTag || ''
      const previewScenes = Array.isArray(box.guidePreview.sceneTags) ? box.guidePreview.sceneTags : []
      box.sceneText = box.scenes.length
        ? box.scenes.map(sceneName).join(' · ')
        : (previewScenes.map(sceneName).join(' · ') || '开盒才能看到')
      box.sceneChips = (box.scenes.length ? box.scenes : previewScenes).map(sceneName).slice(0, 4)
      box.guidePreviewText = box.guidePreview.summary || box.guidePreview.notice || ''
      box.gallery = box.gallery.filter(Boolean)
      if (!box.gallery.length) box.gallery = ['']
      box.hasMultipleImages = box.gallery.length > 1
      const saved = (wx.getStorageSync(SAVED_KEY) || []).indexOf(String(this.id)) >= 0
      this.setData({ box, saved, loading: false, error: '' })
      // 真机明文 http 图片会空白：轮播图统一走媒体缓存本地化（命中持久缓存则秒回）
      const raws = box.gallery.filter(Boolean).map(resolveMedia)
      if (raws.length) {
        fetchDisplayMediaList(raws).then((locals) => {
          const merged = box.gallery.map((u, i) => (u && locals[i]) || u)
          this.setData({ 'box.gallery': merged })
        }).catch(() => {})
      }
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
