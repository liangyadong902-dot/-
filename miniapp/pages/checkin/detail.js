const api = require('../../services/api')
Page({
  data: { item: null, loading: true, error: '' },
  onLoad(options) { this.id = options.id; this.load() },
  async load() { try { this.setData({ item: await api.getCheckin(this.id), loading:false }) } catch(e){ this.setData({ loading:false,error:'打卡不存在或已隐藏' }) } },
  async toggleLike() { const item=await api.likeCheckin(this.id,!this.data.item.liked); this.setData({ item }) },
  async makePoster() { try { const item=await api.makeCheckinPoster(this.id); this.setData({ item }); wx.showToast({ title:'海报已准备好', icon:'none' }) } catch(e){} },
  openTrip() { if (this.data.item) wx.navigateTo({ url:'/pages/trips/detail?id='+this.data.item.tripId }) },
  onShareAppMessage() { return { title:this.data.item ? this.data.item.locationName+' · 途个惊喜' : '途个惊喜', path:'/pages/checkin/detail?id='+this.id } },
})
