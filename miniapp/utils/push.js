const { BASE_URL } = require('./constants')

// 全局 WebSocket 实时推送客户端：服务端 /ws?token=JWT
// 收到消息后分发给订阅者（聊天页 / 消息中心 / 角标刷新）
let socket = null
let manualClosed = false
let reconnectDelay = 2000
const subscribers = new Set()

function wsUrl() {
  const token = wx.getStorageSync('token')
  if (!token) return ''
  return String(BASE_URL || '')
    .replace(/^http/i, 'ws')
    .replace(/\/api\/v1\/?$/, '') + '/ws?token=' + encodeURIComponent(token)
}

function connect() {
  const url = wsUrl()
  if (!url || socket) return
  manualClosed = false
  socket = wx.connectSocket({
    url,
    fail: () => { socket = null; scheduleReconnect() },
  })
  if (!socket) return
  socket.onOpen(() => { reconnectDelay = 2000 })
  socket.onMessage((res) => {
    let data = null
    try { data = JSON.parse(res.data) } catch (e) { return }
    if (!data || !data.channel) return
    subscribers.forEach((fn) => { try { fn(data) } catch (e) { } })
  })
  socket.onError(() => { closeQuiet() })
  socket.onClose(() => { socket = null; if (!manualClosed) scheduleReconnect() })
}

function closeQuiet() {
  if (socket) { try { socket.close({}) } catch (e) { } }
  socket = null
}

function scheduleReconnect() {
  if (manualClosed) return
  setTimeout(() => { if (!socket) connect() }, reconnectDelay)
  reconnectDelay = Math.min(reconnectDelay * 2, 30000)
}

function disconnect() {
  manualClosed = true
  closeQuiet()
}

/** 订阅推送，返回取消订阅函数 */
function subscribe(fn) {
  subscribers.add(fn)
  connect()
  return () => subscribers.delete(fn)
}

module.exports = { connect, disconnect, subscribe }
