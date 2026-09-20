const store = require('../../utils/tuge-store')
const makePage = require('../../behaviors/tuge-page')

function pageH() {
  try {
    const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    return sys.windowHeight || sys.screenHeight || 700
  } catch (e) {
    return 700
  }
}

Page(makePage(1, {
  data: Object.assign({ tabIndex: 1, draft: '', pageH: pageH(), chatH: 200 }, store.snapshot()),
  onLoad() {
    store.hydrateAi()
  },
  onReady() {
    this.relayout()
    setTimeout(() => this.relayout(), 80)
  },
  onResize() {
    this.relayout()
  },
  relayout() {
    this.setData({ pageH: pageH() }, () => {
      wx.nextTick(() => {
        const q = wx.createSelectorQuery().in(this)
        q.select('.ai-chat-col').boundingClientRect()
        q.select('.ai-dock').boundingClientRect()
        q.exec((rects) => {
          const col = rects && rects[0]
          const dock = rects && rects[1]
          if (!col || !dock) return
          const chatH = Math.max(80, Math.floor(col.height - dock.height))
          if (chatH !== this.data.chatH) this.setData({ chatH })
        })
      })
    })
  },
  onDraft(e) {
    this.setData({ draft: e.detail.value })
  },
  sendChat() {
    if (this.data.aiBusy) return
    const text = (this.data.draft || '').trim()
    if (!text) return
    this.setData({ draft: '' })
    store.sendUserMessage(text)
  },
  sendQuick(e) {
    store.sendQuickPrompt(e.currentTarget.dataset.text)
  },
  toggleAiHistory() {
    store.toggleAiHistory()
    setTimeout(() => this.relayout(), 50)
  },
  onAiHistRailClick() {
    store.onAiHistRailClick()
  },
  openAiChat(e) {
    store.openAiChat(e.currentTarget.dataset.id)
  },
  newAiChat() {
    store.newAiChat()
  },
  openUnbox(e) {
    store.openUnboxModal(e.currentTarget.dataset.id)
  },
}))
