const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')

Page(makePage(-1, {
  startTest() { store.startPersonalityTest() },
}))
