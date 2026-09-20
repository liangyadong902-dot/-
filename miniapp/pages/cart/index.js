const api = require('../../services/api')
Page({
  data: { items: [], loading: true, error: '', totalText: '0.00' },
  onShow() { this.load() },
  async load() { try { const result = await api.listCart(); const items = (result && result.list || []).map(item => ({ ...item, subtotalText: Number(item.subtotal || 0).toFixed(2) })); this.setData({ items, loading: false, error: '', totalText: items.filter(i => i.selected !== false).reduce((sum, i) => sum + Number(i.subtotal || 0), 0).toFixed(2) }) } catch (e) { this.setData({ loading: false, error: '购物车服务暂未连接' }) } },
  async remove(e) { try { await api.removeCartItem(e.currentTarget.dataset.id); this.load() } catch (e) {} },
  async toggle(e) { const item = this.data.items.find(row => String(row.itemId) === String(e.currentTarget.dataset.id)); try { await api.updateCartItem(e.currentTarget.dataset.id, { selected: e.detail.value.length > 0, version: item && item.version }); this.load() } catch (e) {} },
  async checkout() { const ids = this.data.items.filter(i => i.selected !== false).map(i => i.itemId); if (!ids.length) return wx.showToast({ title: '请先选择商品', icon: 'none' }); try { const result = await api.checkoutCart(ids); const order = result && result.orders && result.orders[0]; if (order) wx.navigateTo({ url: '/pages/orders/detail?orderNo=' + order.orderNo }) } catch (e) {} },
  goMarket() { wx.navigateTo({ url: '/pages/market/index' }) },
})
