function request(options) {
  return new Promise((resolve, reject) => {
    const app = getApp()
    const baseUrl = (app && app.globalData && app.globalData.baseUrl) || 'http://localhost:8080/api/v1'
    const token = wx.getStorageSync('token')
    const header = {
      'Content-Type': 'application/json',
      ...options.header,
    }
    if (token) {
      header.Authorization = 'Bearer ' + token
    }

    if (!options.silent) {
      wx.showLoading({ title: '加载中...', mask: true })
    }

    wx.request({
      url: baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: 30000,
      success: (res) => {
        if (!options.silent) wx.hideLoading()
        if (res.statusCode === 200) {
          const data = res.data || {}
          if (data.code === 0) {
            resolve(data.data)
          } else {
            if (data.code === 401) {
              wx.removeStorageSync('token')
              wx.removeStorageSync('user')
            }
            wx.showToast({ title: data.message || '请求失败', icon: 'none' })
            reject(new Error(data.message))
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('user')
          if (!options.silent) {
            wx.showToast({ title: '请先登录', icon: 'none' })
          }
          reject(new Error('未登录'))
        } else {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(new Error('HTTP ' + res.statusCode))
        }
      },
      fail: (err) => {
        if (!options.silent) wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}

module.exports = {
  get: (url, data, extra) => request({ url, method: 'GET', data, ...extra }),
  post: (url, data, extra) => request({ url, method: 'POST', data, ...extra }),
  put: (url, data, extra) => request({ url, method: 'PUT', data, ...extra }),
  delete: (url, data, extra) => request({ url, method: 'DELETE', data, ...extra }),
}
