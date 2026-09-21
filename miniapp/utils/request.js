const { BASE_URL } = require('./constants')

// 媒体资源统一以后端当前地址展示：
// 上传接口返回 /uploads/xx 相对路径，历史数据里存过上传端的绝对地址
// （127.0.0.1 / 局域网 IP），换设备或换网络后加载不到，这里统一归一化。
const MEDIA_BASE = String(BASE_URL || '').replace(/\/api\/v1$/, '')
const LAN_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))(?:\.\d{1,3}){2})(:\d+)?\//i

function resolveMedia(url) {
  if (!url) return ''
  const value = String(url)
  if (value.charAt(0) === '/') return MEDIA_BASE + value
  if (LAN_HOST.test(value) && value.indexOf('/uploads/') >= 0) {
    return MEDIA_BASE + value.replace(/^https?:\/\/[^/]+/i, '')
  }
  return value
}

// 真机上 image 组件渲染层会拦截明文 http 图片（iOS WKWebView 安全策略），
// 而 wx.request / wx.uploadFile / wx.downloadFile 走原生层不受影响。
// 因此 http 媒体先经 downloadFile 落到本地临时文件，再交给 image 显示；
// https / 本地路径 / dataURL 原样返回，下载失败回退原地址（开发工具中仍可显示）。
const displayMediaCache = new Map()

function fetchDisplayMedia(url) {
  const target = resolveMedia(url)
  if (!target || !/^http:\/\//i.test(target)) return Promise.resolve(target)
  if (displayMediaCache.has(target)) return Promise.resolve(displayMediaCache.get(target))
  return new Promise((resolve) => {
    wx.downloadFile({
      url: target,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          displayMediaCache.set(target, res.tempFilePath)
          resolve(res.tempFilePath)
        } else {
          resolve(target)
        }
      },
      fail: () => resolve(target),
    })
  })
}

// wx.downloadFile 有 10 个并发上限，排队执行避免真机超限失败
function fetchDisplayMediaList(urls, limit) {
  const list = (urls || []).filter(Boolean)
  if (!list.length) return Promise.resolve([])
  const max = Math.min(Math.max(Number(limit) || 6, 1), 10)
  const results = new Array(list.length)
  let cursor = 0
  function run() {
    if (cursor >= list.length) return Promise.resolve()
    const index = cursor++
    return fetchDisplayMedia(list[index]).then((value) => { results[index] = value }).then(run)
  }
  const workers = []
  for (let i = 0; i < Math.min(max, list.length); i++) workers.push(run())
  return Promise.all(workers).then(() => results)
}

function compactData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  return Object.keys(data).reduce((result, key) => {
    if (data[key] !== undefined && data[key] !== null) result[key] = data[key]
    return result
  }, {})
}

function request(options) {
  return new Promise((resolve, reject) => {
    const app = getApp()
    const baseUrl = (app && app.globalData && app.globalData.baseUrl) || BASE_URL
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
      data: compactData(options.data),
      header,
      timeout: options.timeout || 30000,
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
        wx.showToast({ title: '后端连接失败', icon: 'none' })
        reject(err)
      },
    })
  })
}

module.exports = {
  get: (url, data, extra) => request({ url, method: 'GET', data, ...extra }),
  post: (url, data, extra) => request({ url, method: 'POST', data, ...extra }),
  put: (url, data, extra) => request({ url, method: 'PUT', data, ...extra }),
  patch: (url, data, extra) => request({ url, method: 'PATCH', data, ...extra }),
  delete: (url, data, extra) => request({ url, method: 'DELETE', data, ...extra }),
  resolveMedia,
  fetchDisplayMedia,
  fetchDisplayMediaList,
}
