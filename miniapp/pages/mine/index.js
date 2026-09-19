const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')

Page(makePage(4, {
  onMenu(e) { store.onMineMenu(e.currentTarget.dataset.action) },
  onAvatarError() { store.recoverAvatarDisplay() },
}))
