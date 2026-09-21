const api = require('../../services/api')
const { resolveMedia, fetchDisplayMediaList } = require('../../utils/request')

// 图片/头像可能存的是上传端的局域网地址，展示前统一换成当前后端地址
function decorateCheckin(item) {
  if (!item) return item
  return Object.assign({}, item, {
    imageUrls: (item.imageUrls || []).map((url) => resolveMedia(url)),
    user: item.user ? Object.assign({}, item.user, { avatarUrl: resolveMedia(item.user.avatarUrl || '') }) : item.user,
  })
}

Page({
  data: { item: null, loading: true, error: '' },
  onLoad(options) { this.id = options.id; this.load() },
  async load() { try { this.setData({ item: decorateCheckin(await api.getCheckin(this.id)), loading:false }); this.hydrateMedia() } catch(e){ this.setData({ loading:false,error:'打卡不存在或已隐藏' }) } },
  async toggleLike() { const item=await api.likeCheckin(this.id,!this.data.item.liked); this.setData({ item: decorateCheckin(item) }); this.hydrateMedia() },
  async makePoster() { try { const item=await api.makeCheckinPoster(this.id); this.setData({ item: decorateCheckin(item) }); this.hydrateMedia(); wx.showToast({ title:'海报已准备好', icon:'none' }) } catch(e){} },
  // 真机 image 渲染层加载不了明文 http 图片：先下载到本地临时文件再替换显示地址
  async hydrateMedia() {
    const item = this.data.item
    if (!item) return
    const slots = []
    ;(item.imageUrls || []).forEach((url, index) => {
      if (url) slots.push({ path: 'item.imageUrls[' + index + ']', url })
    })
    if (item.user && item.user.avatarUrl) slots.push({ path: 'item.user.avatarUrl', url: item.user.avatarUrl })
    if (!slots.length) return
    const resolved = await fetchDisplayMediaList(slots.map((slot) => slot.url))
    const patch = {}
    slots.forEach((slot, index) => {
      if (resolved[index] && resolved[index] !== slot.url) patch[slot.path] = resolved[index]
    })
    if (Object.keys(patch).length) this.setData(patch)
  },
  openTrip() { if (this.data.item) wx.navigateTo({ url:'/pages/trips/detail?id='+this.data.item.tripId }) },
  onShareAppMessage() { return { title:this.data.item ? this.data.item.locationName+' · 途个惊喜' : '途个惊喜', path:'/pages/checkin/detail?id='+this.id } },
})
