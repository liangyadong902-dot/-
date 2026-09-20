const store = require('./utils/tuge-store')
const { BASE_URL } = require('./utils/constants')

App({
  onLaunch() {
    store.init()
  },
  globalData: {
    baseUrl: BASE_URL,
  },
})
