Page({
  data: {
    phone: '',
    code: '',
  },
  onShow() {
    try {
      const pages = getCurrentPages()
      pages.forEach((page) => {
        if (!page || typeof page.getTabBar !== 'function') return
        const bar = page.getTabBar()
        if (bar && typeof bar.setData === 'function') bar.setData({ hidden: true })
      })
    } catch (e) {}
  },
  onPhone(e) {
    this.setData({ phone: e.detail.value })
  },
  onCode(e) {
    this.setData({ code: e.detail.value })
  },
  async sendSms() {
    const api = require('../../services/api')
    await api.sendSms(this.data.phone)
    wx.showToast({ title: '验证码 123456', icon: 'none' })
  },
  async onSubmit() {
    const api = require('../../services/api')
    try {
      const result = await api.loginPhone(this.data.phone, this.data.code)
      wx.setStorageSync('token', result.token)
      wx.setStorageSync('user', result.user)
    } catch (e) {
      return
    }
    this.onSubmitSuccess()
  },
  onWxChooseAvatar(e) {
    const store = require('../../utils/tuge-store')
    store.submitWxLogin(e).then((ok) => {
      if (ok) this.onSubmitSuccess()
    })
  },
  onSubmitSuccess() {
    const pages = getCurrentPages()
    if (pages.length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/index/index' })
  },
})
