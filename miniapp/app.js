const store = require('./utils/tuge-store')

App({
  onLaunch() {
    store.init()
  },
  globalData: {
    baseUrl: 'http://localhost:8080/api/v1',
  },
})
