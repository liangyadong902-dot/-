const api = require('../../services/api')
Page({
  data: { tabs: [{ key: 'influence', label: '影响力' }, { key: 'post', label: '发帖' }, { key: 'checkin', label: '打卡' }], metric: 'influence', creators: [], loading: true, error: '' },
  onLoad() { this.load() },
  async load() { this.setData({ loading: true, error: '' }); try { const creators = await api.listCreators({ metric: this.data.metric, period: 'all', page: 1, pageSize: 50 }); this.setData({ creators: (creators || []).map((item) => ({ ...item, ...(item.user || {}) })), loading: false }) } catch (e) { this.setData({ loading: false, error: '达人榜暂时无法加载' }) } },
  switchMetric(e) { this.setData({ metric: e.currentTarget.dataset.key }); this.load() },
  async follow(e) { const id = e.currentTarget.dataset.id; const active = !e.currentTarget.dataset.followed; try { await api.followCommunityUser(id, active); this.setData({ creators: this.data.creators.map(item => String(item.userId) === String(id) ? { ...item, followed: active } : item) }) } catch (err) {} },
})
