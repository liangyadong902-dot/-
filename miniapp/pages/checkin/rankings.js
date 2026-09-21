const api = require('../../services/api')
const { resolveMedia, fetchDisplayMediaList } = require('../../utils/request')
Page({ data:{ list:[], loading:true, period:'all' }, onLoad(){ this.load() }, async load(){ this.setData({loading:true}); try{ const list=await api.listCheckinRankings({period:this.data.period}); this.setData({list:(list||[]).map((item)=>Object.assign({},item,{user:item.user?Object.assign({},item.user,{avatarUrl:resolveMedia(item.user.avatarUrl||'')}):item.user})),loading:false}); this.hydrateMedia() }catch(e){this.setData({loading:false})} }, switchPeriod(e){this.setData({period:e.currentTarget.dataset.period},()=>this.load())},
  // 真机 image 渲染层加载不了明文 http 图片：先下载到本地临时文件再替换显示地址
  async hydrateMedia() {
    const list = this.data.list
    if (!list.length) return
    const slots = []
    list.forEach((item, index) => {
      const avatar = item.user && item.user.avatarUrl
      if (avatar) slots.push({ path: 'list[' + index + '].user.avatarUrl', url: avatar })
    })
    if (!slots.length) return
    const resolved = await fetchDisplayMediaList(slots.map((slot) => slot.url))
    const patch = {}
    slots.forEach((slot, index) => {
      if (resolved[index] && resolved[index] !== slot.url) patch[slot.path] = resolved[index]
    })
    if (Object.keys(patch).length) this.setData(patch)
  } })
