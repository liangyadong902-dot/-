const PREFIX = 'tuge_'

function get(key) {
  return wx.getStorageSync(PREFIX + key)
}

function set(key, value) {
  wx.setStorageSync(PREFIX + key, value)
}

function remove(key) {
  wx.removeStorageSync(PREFIX + key)
}

module.exports = { get, set, remove }
