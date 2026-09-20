const api = require('../../services/api')

const moodLabels = { happy: '开心', emo: '有点 emo', bored: '无聊', curious: '想探索' }
const categoryLabels = { nearby: '周边游', province: '省内游', cross: '跨省游', theme: '主题专线' }

Page({
  data: {
    loading: true,
    error: '',
    stats: null,
    personality: null,
    destinationsText: '暂无',
    recentMoodText: '暂无',
    favoriteCategoryText: '暂无',
  },
  onLoad() { this.load() },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()) },
  goBack() { wx.navigateBack() },
  async load() {
    if (!wx.getStorageSync('token')) {
      this.setData({ loading: false, error: '请先登录后查看资产' })
      return
    }
    this.setData({ loading: true, error: '' })
    try {
      const [stats, personality] = await Promise.all([
        api.meStatsDetail(),
        api.myPersonality().catch(() => null),
      ])
      this.setData({
        loading: false,
        stats,
        personality,
        destinationsText: (stats.destinations || []).join('、') || '暂无',
        recentMoodText: moodLabels[stats.recentMood] || '暂无',
        favoriteCategoryText: categoryLabels[stats.favoriteCategory] || '暂无',
      })
    } catch (e) {
      this.setData({ loading: false, error: '资产加载失败，请下拉重试' })
    }
  },
})
