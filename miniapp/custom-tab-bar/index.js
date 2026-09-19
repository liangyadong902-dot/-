Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  data: {
    selected: 0,
    hidden: false,
    list: [
      { key: 'home', path: '/pages/index/index', text: '首页', icon: '/assets/tabs/home.png', activeIcon: '/assets/tabs/home-active.png' },
      { key: 'ai', path: '/pages/ai/index', text: 'AI搭子', icon: '/assets/tabs/ai.png', activeIcon: '/assets/tabs/ai-active.png' },
      { key: 'community', path: '/pages/community/index', text: '社区', icon: '/assets/tabs/community.png', activeIcon: '/assets/tabs/community-active.png' },
      { key: 'trips', path: '/pages/trips/index', text: '行程', icon: '/assets/tabs/trips.png', activeIcon: '/assets/tabs/trips-active.png' },
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
