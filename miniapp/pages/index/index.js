const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')

Page(makePage(0, {
  setSpecial(e) {
    store.setSpecial(Number(e.currentTarget.dataset.n))
  },
  openCurrentSpecial() {
    store.openCurrentSpecial()
  },
  filterMood(e) {
    store.filterMood(e.currentTarget.dataset.mood)
  },
  filterCategory(e) {
    store.filterCategory(e.currentTarget.dataset.cat)
  },
  filterCategoryAll() {
    store.filterCategoryAll()
  },
  openUnbox(e) {
    store.openUnboxModal(e.currentTarget.dataset.id)
  },
  goBadges() {
    store.switchNav('badges')
  },
  onBanner(e) {
    store.handleBanner(e.currentTarget.dataset.id)
  },
}))
