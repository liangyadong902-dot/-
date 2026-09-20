const api = require('../../services/api')
Page({data:{item:null,loading:true,error:''},onLoad(options){this.code=options.code;this.load()},async load(){try{this.setData({item:await api.getAchievement(this.code),loading:false})}catch(e){this.setData({loading:false,error:'成就不存在'})}}})
