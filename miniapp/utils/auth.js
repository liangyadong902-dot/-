function checkLogin() {
  return !!wx.getStorageSync('token')
}

function getUser() {
  const userStr = wx.getStorageSync('user')
  if (!userStr) return null
  try {
    return typeof userStr === 'string' ? JSON.parse(userStr) : userStr
  } catch (e) {
    return null
  }
}

function saveLogin(token, user) {
  wx.setStorageSync('token', token)
  wx.setStorageSync('user', user ? JSON.stringify(user) : '')
}

function clearLogin() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('user')
}

function hideCustomTabBar() {
  try {
    const pages = getCurrentPages()
    pages.forEach((page) => {
      if (!page || typeof page.getTabBar !== 'function') return
      const bar = page.getTabBar()
      if (bar && typeof bar.setData === 'function') bar.setData({ hidden: true })
    })
  } catch (e) {}
}

function requireLogin(callback) {
  if (checkLogin()) {
    callback()
  } else {
    hideCustomTabBar()
    wx.navigateTo({ url: '/pages/login/login' })
  }
}

module.exports = {
  checkLogin,
  getUser,
  saveLogin,
  clearLogin,
  requireLogin,
}
