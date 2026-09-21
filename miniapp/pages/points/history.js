const api = require('../../services/api')
Page({
  data: { list: [], loading: true, error: '', empty: false, page: 1, hasMore: true },
  onLoad() { this.load() },
  async load() { this.setData({ loading: true, error: '' }); try { const res = await api.listPointHistory({ page: this.data.page, pageSize: 20 }); const list = this.data.page === 1 ? (res.list || []) : this.data.list.concat(res.list || []); this.setData({ list, loading: false, empty: !list.length, hasMore: res.total > this.data.page * 20, page: this.data.page + 1 }) } catch (e) { this.setData({ loading: false, error: '明细加载失败' }) } },
  more() { if (this.data.hasMore && !this.data.loading) this.load() },
  retry() { this.setData({ page: 1 }, () => this.load()) },
})
