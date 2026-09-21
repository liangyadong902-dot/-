const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')
const api = require('../../services/api')

Page(makePage(4, {
  onMenu(e) { store.onMineMenu(e.currentTarget.dataset.action) },
  onAvatarError() { store.recoverAvatarDisplay() },
  onStoreShow() { this.refreshBadges() },
  goProfile() {
    const user = wx.getStorageSync('user') || {}
    if (!user.id || !wx.getStorageSync('token')) { store.openLogin({ type: 'mine' }); return }
    wx.navigateTo({ url: '/pages/profile/index?me=1' })
  },
  goMessages() {
    if (!wx.getStorageSync('token')) { store.openLogin({ type: 'mine' }); return }
    wx.navigateTo({ url: '/pages/message/index' })
  },
  async refreshBadges() {
    if (!wx.getStorageSync('token')) return
    try {
      const [notice, dm] = await Promise.all([api.notificationUnread(), api.dmUnreadTotal()])
      this.setData({ msgBadge: (notice || 0) + (dm || 0) })
    } catch (e) { /* 静默 */ }
  },
}))
