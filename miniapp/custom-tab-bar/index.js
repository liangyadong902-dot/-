const store = require('../utils/tuge-store')

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  data: {
    selected: 0,
    hidden: false,
    msgBadge: 0,
    list: [
      { key: 'home', path: '/pages/index/index', text: '首页', icon: '/assets/tabs/home.png', activeIcon: '/assets/tabs/home-active.png' },
      { key: 'market', path: '/pages/market/index', text: '商品', icon: '/assets/icons/gift-muted.svg', activeIcon: '/assets/icons/gift.png' },
      { key: 'community', path: '/pages/community/index', text: '社区', icon: '/assets/tabs/community.png', activeIcon: '/assets/tabs/community-active.png' },
      { key: 'message', path: '/pages/message/index', text: '消息', icon: '/assets/tabs/message.png', activeIcon: '/assets/tabs/message-active.png' },
      { key: 'mine', path: '/pages/mine/index', text: '我的', icon: '/assets/tabs/mine.png', activeIcon: '/assets/tabs/mine-active.png' },
    ],
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      const route = page && page.route ? '/' + page.route : ''
      const idx = this.data.list.findIndex((i) => i.path === route)
      if (idx >= 0) this.setData({ selected: idx })
      // 跟随 store 更新「消息」tab 未读角标
      this.setData({ msgBadge: store.snapshot().msgBadge || 0 })
      this._unsub = store.subscribe((snap) => {
        const badge = snap.msgBadge || 0
        if (badge !== this.data.msgBadge) this.setData({ msgBadge: badge })
      })
    },
    detached() {
      if (this._unsub) { this._unsub(); this._unsub = null }
    },
  },
  methods: {
    onChange(e) {
      const { path, index } = e.currentTarget.dataset
      if (index === this.data.selected) return
      wx.switchTab({ url: path })
    },
  },
})
