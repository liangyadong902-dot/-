const store = require('../utils/tuge-store')

module.exports = function makePage(tabIndex, extra) {
  return Object.assign({
    data: Object.assign({ tabIndex }, store.snapshot()),
    onShow() {
      const bar = typeof this.getTabBar === 'function' && this.getTabBar()
      if (bar && tabIndex >= 0) {
        bar.setData({
          selected: tabIndex,
          hidden: !!store.snapshot().anyModal,
        })
      }
      if (!this._unsub) {
        this._unsub = store.subscribe((s) => this.setData(s))
      } else {
        this.setData(store.snapshot())
      }
    },
    onUnload() {
      if (this._unsub) {
        this._unsub()
        this._unsub = null
      }
    },
  }, extra || {})
}
