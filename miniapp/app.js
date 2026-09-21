const store = require('./utils/tuge-store')
const { BASE_URL } = require('./utils/constants')
const push = require('./utils/push')

App({
  onLaunch() {
    store.init()
  },
  onShow() {
    // 登录状态下保持实时推送连接（断线自动重连）
    if (!wx.getStorageSync('token')) return
    push.connect()
    if (!this._unsubPush) {
      this._unsubPush = push.subscribe((msg) => {
        // 私信在聊天页内实时上屏，不弹提示；其余通知全局轻提示
        if (msg.channel === 'notice') {
          wx.showToast({ title: '新通知：' + (msg.content || ''), icon: 'none', duration: 2500 })
        }
      })
    }
  },
  globalData: {
    baseUrl: BASE_URL,
  },
})
