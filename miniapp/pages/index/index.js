const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')

Page(makePage(0, {
  onStoreShow() {
    store.refreshHome()
  },
  setSpecial(e) {
    store.setSpecial(Number(e.currentTarget.dataset.n))
  },
  openCurrentSpecial() {
    store.openCurrentSpecial()
  },
  filterMood(e) {
    store.filterMood(e.currentTarget.dataset.mood)
  },
  pickMood(e) {
    store.pickMood(e.currentTarget.dataset.mood)
  },
  rotateMoodPick() {
    store.rotateMoodPick()
  },
  openMoodPick() {
    store.openMoodPick()
  },
  filterCategory(e) {
    store.filterCategory(e.currentTarget.dataset.cat)
  },
  filterCategoryAll() {
    store.filterCategoryAll()
  },
  onSearchInput(e) {
    store.onSearchInput(e.detail.value)
  },
  submitSearch() {
    store.submitSearch()
  },
  clearSearch() {
    store.clearSearch()
  },
  openUnbox(e) {
    store.openUnboxModal(e.currentTarget.dataset.id)
  },
  // 点人气推荐卡片跳商品详情；item.id 是 box_数字 前缀格式，去掉前缀取真实盲盒 id
  openProduct(e) {
    const id = String(e.currentTarget.dataset.id || '').replace(/^box_/, '')
    if (!id || !/^\d+$/.test(id)) return
    wx.navigateTo({ url: '/pages/product/detail?id=' + id })
  },
  goBadges() {
    store.switchNav('badges')
  },
  onBanner(e) {
    store.handleBanner(e.currentTarget.dataset.id)
  },
}))
