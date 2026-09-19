const request = require('../utils/request')

module.exports = {
  sendSms: (phone) => request.post('/auth/sms/send', { phone }),
  loginPhone: (phone, code) => request.post('/auth/login/phone', { phone, code }),
  loginWechat: (profile) => request.post('/auth/login/wechat', profile),
  me: () => request.get('/me'),
  listBoxes: (params) => request.get('/boxes', params, { silent: true }),
  listBanners: () => request.get('/banners', undefined, { silent: true }),
  listBadges: () => request.get('/badges', undefined, { silent: true }),
  getBox: (id) => request.get('/boxes/' + id, undefined, { silent: true }),
  createMoodLog: (mood, boxId) => request.post('/mood-logs', { mood, boxId }, { silent: true }),
  createOrder: (boxId) => request.post('/orders', { boxId }),
  listOrders: (params) => request.get('/orders', params, { silent: true }),
  getOrder: (orderNo) => request.get('/orders/' + orderNo, undefined, { silent: true }),
  payOrder: (orderNo) => request.post('/orders/' + orderNo + '/pay', { channel: 'alipay' }),
  cancelOrder: (orderNo) => request.post('/orders/' + orderNo + '/cancel', {}),
  refundOrder: (orderNo, reason, kind = 'unused') => request.post('/orders/' + orderNo + '/refund', { reason, kind }),
  listTrips: () => request.get('/trips', undefined, { silent: true }),
  getTrip: (id) => request.get('/trips/' + id, undefined, { silent: true }),
  generateDiary: (id) => request.post('/trips/' + id + '/diary', {}),
  health: () => request.get('/health', undefined, { silent: true }),
}
