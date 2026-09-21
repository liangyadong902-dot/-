const api = require('../../services/api')
Page({
  data: { tripId: '', locationName: '', locationAddress: '', latitude: null, longitude: null, note: '', images: [], sending: false, progress: '' },
  onLoad(options) { this.setData({ tripId: options.tripId || '' }) },
  inputLocation(e) { this.setData({ locationName: e.detail.value }) }, inputNote(e) { this.setData({ note: e.detail.value }) },
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const name = res.name || res.address || ((res.latitude != null) ? '已选位置(' + res.latitude.toFixed(4) + ',' + res.longitude.toFixed(4) + ')' : '')
        if (!name) return
        this.setData({
          locationName: name,
          locationAddress: res.address || '',
          latitude: res.latitude,
          longitude: res.longitude
        })
        wx.showToast({ title: '已填入选点', icon: 'success' })
      },
      fail: (err) => {
        const msg = String((err && err.errMsg) || '')
        if (msg.indexOf('auth') > -1 || msg.indexOf('deny') > -1) {
          wx.showModal({ title: '需要位置权限', content: '开启位置权限后可定位并选择景点，也可以手动填写地点。', confirmText: '去设置', success: (r) => { if (r.confirm) wx.openSetting() } })
        } else if (msg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选点失败:' + (msg.replace('chooseLocation:fail', '').trim() || '未知原因'), icon: 'none', duration: 3000 })
        }
      }
    })
  },
  chooseImages() { const remain = 9 - this.data.images.length; if (!remain) return wx.showToast({ title: '最多9张图片', icon:'none' }); wx.chooseMedia({ count: remain, mediaType:['image'], sourceType:['album','camera'], success: (res) => this.setData({ images: this.data.images.concat((res.tempFiles || []).map(x => x.tempFilePath)) }) }) },
  removeImage(e) { const list=this.data.images.slice(); list.splice(e.currentTarget.dataset.index,1); this.setData({ images:list }) },
  async submit() { if (this.data.sending) return; if (!this.data.tripId || !this.data.locationName.trim() || !this.data.images.length) return wx.showToast({ title:'请补全行程、地点和照片', icon:'none' }); this.setData({ sending:true }); try { const urls=[]; for(let i=0;i<this.data.images.length;i++){ this.setData({ progress:'上传照片 '+(i+1)+'/'+this.data.images.length }); const r=await api.uploadImage(this.data.images[i]); const up=String(r.url||''); const rel=up.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i); urls.push(rel?rel[1]:up) } const payload={ tripId:Number(this.data.tripId), locationName:this.data.locationName.trim(), imageUrls:urls, note:this.data.note.trim(), publicLocation:false }; if (typeof this.data.latitude==='number' && typeof this.data.longitude==='number') { payload.latitude=this.data.latitude; payload.longitude=this.data.longitude } const r=await api.createCheckin(payload); wx.showModal({ title:'打卡成功', content:r.newlyUnlocked && r.newlyUnlocked.length ? '有新的行为成就解锁了。' : '这次旅程已经记下来了。', showCancel:false, success:()=>wx.redirectTo({ url:'/pages/checkin/detail?id='+r.checkin.checkinId }) }) } catch(e){ wx.showToast({ title:e.message || '打卡失败', icon:'none' }) } finally { this.setData({ sending:false, progress:'' }) } },
})
