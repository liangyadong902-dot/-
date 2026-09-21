const api = require('../../services/api')
const { resolveMedia, fetchDisplayMediaList } = require('../../utils/request')

// 图片可能存的是上传端的局域网地址，展示前统一换成当前后端地址
function decorateCheckin(item) {
  return Object.assign({}, item, {
    imageUrls: (item.imageUrls || []).map((url) => resolveMedia(url)),
  })
}

Page({
  data: { loading: true, list: [], error: '' },
  onShow() { this.load() },
  async load() { this.setData({ loading: true }); try { const res = await api.listMyCheckins({ page: 1, pageSize: 50 }); this.setData({ list: (res.list || []).map(decorateCheckin), loading: false }); this.hydrateMedia() } catch (e) { this.setData({ loading: false, error: '打卡记录加载失败' }) } },
  // 真机 image 渲染层加载不了明文 http 图片：先下载到本地临时文件再替换显示地址
  async hydrateMedia() {
    const list = this.data.list
    if (!list.length) return
    const slots = []
    list.forEach((item, index) => {
      (item.imageUrls || []).forEach((url, i) => {
        if (url) slots.push({ path: 'list[' + index + '].imageUrls[' + i + ']', url })
      })
    })
    if (!slots.length) return
    const resolved = await fetchDisplayMediaList(slots.map((slot) => slot.url))
    const patch = {}
    slots.forEach((slot, index) => {
      if (resolved[index] && resolved[index] !== slot.url) patch[slot.path] = resolved[index]
    })
    if (Object.keys(patch).length) this.setData(patch)
  },
  openDetail(e) { wx.navigateTo({ url: '/pages/checkin/detail?id=' + e.currentTarget.dataset.id }) },
  openRankings() { wx.navigateTo({ url: '/pages/checkin/rankings' }) },
})
