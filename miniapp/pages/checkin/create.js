const api = require('../../services/api')
Page({
  data: { tripId: '', locationName: '', note: '', images: [], sending: false, progress: '' },
  onLoad(options) { this.setData({ tripId: options.tripId || '' }) },
  inputLocation(e) { this.setData({ locationName: e.detail.value }) }, inputNote(e) { this.setData({ note: e.detail.value }) },
  chooseImages() { const remain = 9 - this.data.images.length; if (!remain) return wx.showToast({ title: '最多9张图片', icon:'none' }); wx.chooseMedia({ count: remain, mediaType:['image'], sourceType:['album','camera'], success: (res) => this.setData({ images: this.data.images.concat((res.tempFiles || []).map(x => x.tempFilePath)) }) }) },
  removeImage(e) { const list=this.data.images.slice(); list.splice(e.currentTarget.dataset.index,1); this.setData({ images:list }) },
  async submit() { if (this.data.sending) return; if (!this.data.tripId || !this.data.locationName.trim() || !this.data.images.length) return wx.showToast({ title:'请补全行程、地点和照片', icon:'none' }); this.setData({ sending:true }); try { const urls=[]; for(let i=0;i<this.data.images.length;i++){ this.setData({ progress:'上传照片 '+(i+1)+'/'+this.data.images.length }); const r=await api.uploadImage(this.data.images[i]); urls.push(r.url) } const r=await api.createCheckin({ tripId:Number(this.data.tripId), locationName:this.data.locationName.trim(), imageUrls:urls, note:this.data.note.trim(), publicLocation:false }); wx.showModal({ title:'打卡成功', content:r.newlyUnlocked && r.newlyUnlocked.length ? '有新的行为成就解锁了。' : '这次旅程已经记下来了。', showCancel:false, success:()=>wx.redirectTo({ url:'/pages/checkin/detail?id='+r.checkin.checkinId }) }) } catch(e){ wx.showToast({ title:e.message || '打卡失败', icon:'none' }) } finally { this.setData({ sending:false, progress:'' }) } },
})
