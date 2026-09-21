const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')

Page(makePage(-1, {
  openTrip(e) {
    wx.navigateTo({ url: '/pages/trips/detail?id=' + e.currentTarget.dataset.id })
  },
  openGuide(e) {
    wx.navigateTo({ url: '/pages/guide/detail?tripId=' + e.currentTarget.dataset.id })
  },
  goLogin() { store.openLogin({ type: 'trips' }) },
  goHome() { store.goHomeFromEmpty() },
}))
