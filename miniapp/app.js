const store = require('./utils/tuge-store')
const { BASE_URL } = require('./utils/constants')
const { thumbMediaUrl, fetchDisplayMediaList } = require('./utils/request')
const push = require('./utils/push')

// 启动后台静默预取社区封面缩略图进本地持久缓存，用户点开「旅途笔记」时基本零等待
function prefetchCommunityMedia() {
  const api = require('./services/api')
  api.listCommunityPosts({ view: 'discover', sort: 'recent', page: 1, pageSize: 20 })
    .then((posts) => {
      const urls = []
      ;((posts && posts.list) || []).forEach((post) => {
        if (post.imageUrls && post.imageUrls[0]) urls.push(thumbMediaUrl(post.imageUrls[0], 600))
        if (post.author && post.author.avatarUrl) urls.push(thumbMediaUrl(post.author.avatarUrl, 200))
      })
      return fetchDisplayMediaList(urls)
    })
    .catch(() => {})
}

App({
  onLaunch() {
    store.init()
    prefetchCommunityMedia()
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
