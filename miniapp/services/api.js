const request = require('../utils/request')

module.exports = {
  sendSms: (phone, scene = 'login') => request.post('/auth/sms/send', { phone, scene }),
  loginPhone: (phone, code, smsToken) => request.post('/auth/login/phone', { phone, code, smsToken }),
  loginWechat: (profile) => request.post('/auth/login/wechat', profile),
  me: () => request.get('/me'),
  updateMe: (data) => request.patch('/me', data),
  meStats: () => request.get('/me/stats'),
  meStatsDetail: () => request.get('/me/stats-detail'),
  listPersonalityQuestions: () => request.get('/personality/questions', undefined, { silent: true }),
  submitPersonality: (data) => request.post('/personality/submit', data),
  myPersonality: () => request.get('/personality/my-result', undefined, { silent: true }),
  aiConfig: () => request.get('/ai/config', undefined, { silent: true }),
  aiMessages: (params) => request.get('/ai/messages', params, { silent: true }),
  aiConversations: () => request.get('/ai/conversations', undefined, { silent: true }),
  createAiConversation: () => request.post('/ai/conversations', {}, { silent: true }),
  aiConversationMessages: (id, params) => request.get('/ai/conversations/' + encodeURIComponent(id) + '/messages', params, { silent: true }),
  // Provider responses can be slower than ordinary page requests. Keep the
  // request open long enough for the backend's bounded provider/fallback path.
  aiChat: (data) => request.post('/ai/chat', data, { silent: true, timeout: 60000 }),
  listBoxes: (params) => request.get('/boxes', params, { silent: true }),
  listBanners: () => request.get('/banners', undefined, { silent: true }),
  listBadges: () => request.get('/badges', undefined, { silent: true }),
  getBox: (id) => request.get('/boxes/' + id, undefined, { silent: true }),
  listRelatedPosts: (id, params) => request.get('/boxes/' + id + '/related-posts', params, { silent: true }),
  createMoodLog: (mood, boxId) => request.post('/mood-logs', { mood, boxId }, { silent: true }),
  createOrder: (boxId) => request.post('/orders', { boxId }),
  listOrders: (params) => request.get('/orders', params, { silent: true }),
  getOrder: (orderNo) => request.get('/orders/' + orderNo, undefined, { silent: true }),
  payOrder: (orderNo) => request.post('/orders/' + orderNo + '/pay', { channel: 'alipay' }),
  cancelOrder: (orderNo) => request.post('/orders/' + orderNo + '/cancel', {}),
  refundOrder: (orderNo, reason, kind = 'unused') => request.post('/orders/' + orderNo + '/refund', { reason, kind }),
  listTrips: (params) => {
    const options = params || {}
    return request.get('/trips', { ...options, validity: options.validity || 'valid' }, { silent: true })
  },
  getTrip: (id) => request.get('/trips/' + id, undefined, { silent: true }),
  getTripGuide: (id) => request.get('/trips/' + id + '/guide', undefined, { silent: true }),
  generateDiary: (id) => request.post('/trips/' + id + '/diary', {}),
  health: () => request.get('/health', undefined, { silent: true }),
  listCommunityPosts: (params) => request.get('/community/posts', params, { silent: true }),
  getCommunityPost: (id) => request.get('/community/posts/' + id, undefined, { silent: true }),
  createCommunityPost: (data) => request.post('/community/posts', data),
  deleteCommunityPost: (id) => request.delete('/community/posts/' + id),
  likeCommunityPost: (id, active) => active ? request.put('/community/posts/' + id + '/like', {}) : request.delete('/community/posts/' + id + '/like'),
  collectCommunityPost: (id, active) => active ? request.put('/community/posts/' + id + '/collection', {}) : request.delete('/community/posts/' + id + '/collection'),
  shareCommunityPost: (id, channel) => request.post('/community/posts/' + id + '/share', { channel }),
  deletePostComment: (id) => request.delete('/community/comments/' + id),
  listPostComments: (id, params) => request.get('/community/posts/' + id + '/comments', params, { silent: true }),
  createPostComment: (id, data) => request.post('/community/posts/' + id + '/comments', data),
  listTopics: (params) => request.get('/community/topics', params, { silent: true }),
  followTopic: (id, active) => active ? request.put('/community/topics/' + id + '/follow', {}) : request.delete('/community/topics/' + id + '/follow'),
  followCommunityUser: (id, active) => active ? request.put('/community/users/' + id + '/follow', {}) : request.delete('/community/users/' + id + '/follow'),
  listCreators: (params) => request.get('/community/creators', params, { silent: true }),
  listMyPosts: (params) => request.get('/me/posts', params, { silent: true }),
  listCollections: (params) => request.get('/me/collections', params, { silent: true }),
  checkinEligibility: (tripId) => request.get('/trips/' + tripId + '/checkin-eligibility', undefined, { silent: true }),
  listCheckins: (params) => request.get('/checkins', params, { silent: true }),
  listMyCheckins: (params) => request.get('/me/checkins', params, { silent: true }),
  createCheckin: (data) => request.post('/checkins', data),
  getCheckin: (id) => request.get('/checkins/' + id, undefined, { silent: true }),
  likeCheckin: (id, active) => active ? request.put('/checkins/' + id + '/like', {}) : request.delete('/checkins/' + id + '/like'),
  makeCheckinPoster: (id) => request.post('/checkins/' + id + '/poster', {}),
  listCheckinRankings: (params) => request.get('/checkins/rankings', params, { silent: true }),
  listAchievements: (params) => request.get('/achievements', params, { silent: true }),
  getAchievement: (code) => request.get('/achievements/' + code, undefined, { silent: true }),
  listMyAchievements: (params) => request.get('/me/achievements', params, { silent: true }),
  checkAchievements: () => request.post('/me/achievements/check', {}),
  listPaymentRecords: (params) => request.get('/me/payment-records', params, { silent: true }),
  listRefunds: (params) => request.get('/refunds', params, { silent: true }),
  listCart: () => request.get('/cart/items', undefined, { silent: true }),
  addCartItem: (boxId, quantity = 1) => request.post('/cart/items', { boxId, quantity }),
  updateCartItem: (id, data) => request.patch('/cart/items/' + id, data),
  removeCartItem: (id) => request.delete('/cart/items/' + id),
  checkoutCart: (itemIds) => request.post('/cart/checkout', { itemIds }),
  updateProfile: (fields) => request.put('/me', fields),
  uploadImage: (filePath) => new Promise((resolve, reject) => {
    const app = getApp()
    const baseUrl = (app && app.globalData && app.globalData.baseUrl) || require('../utils/constants').BASE_URL
    const token = wx.getStorageSync('token')
    wx.uploadFile({
      url: baseUrl + '/upload/image',
      filePath,
      name: 'file',
      header: token ? { Authorization: 'Bearer ' + token } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data || '{}')
          if (res.statusCode === 401 || body.code === 401) {
            wx.removeStorageSync('token')
            wx.removeStorageSync('user')
            return reject(new Error('请先登录'))
          }
          if (body.code !== 0) return reject(new Error(body.message || '图片上传失败'))
          const data = body.data || {}
          if (data.url && data.url.indexOf('/') === 0) data.url = baseUrl.replace(/\/api\/v1$/, '') + data.url
          resolve(data)
        } catch (e) { reject(new Error('图片上传响应异常')) }
      },
      fail: (err) => reject(new Error((err && err.errMsg) || '图片上传失败')),
    })
  }),
}
