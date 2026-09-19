const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')

Page(makePage(3, {
  openTrip(e) { store.openTripDetail(e.currentTarget.dataset.id) },
  goLogin() { store.openLogin({ type: 'trips' }) },
  goHome() { store.goHomeFromEmpty() },
}))
