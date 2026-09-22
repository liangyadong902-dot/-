const makePage = require('../../behaviors/tuge-page')
const api = require('../../services/api')
const { resolveMedia, thumbMediaUrl, fetchDisplayMediaList } = require('../../utils/request')

// 统一评论时间展示：去掉 ISO 的 T；后端缺 createdAt 时返回空串，避免渲染 "null"
function fmtCommentDate(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(5, 16)
}

// 图片/头像可能存的是上传端的局域网地址，统一换成当前后端地址再渲染
function resolveAuthor(author) {
  if (!author) return author
  return Object.assign({}, author, { avatarUrl: thumbMediaUrl(author.avatarUrl || '', 200) })
}

function resolvePost(post) {
  if (!post) return post
  const next = Object.assign({}, post, {
    // 1080px 缩略图：手机全宽足够清晰，解码耗时比 3-5MB 原图低一个量级
    imageUrls: (post.imageUrls || []).map((url) => thumbMediaUrl(url, 1080)),
    author: resolveAuthor(post.author),
  })
  ;['linkedBox', 'linkedTrip', 'linkedCheckin'].forEach((key) => {
    if (next[key]) next[key] = Object.assign({}, next[key], { coverUrl: thumbMediaUrl(next[key].coverUrl || '', 600) })
  })
  return next
}

function decorateComment(item, postAuthorId, nameMap, suppressReplyToUserId) {
  const author = resolveAuthor(item.author)
  // 小红书式：回复主评论作者时无需重复 @（语境明确），其余情况显示「回复 @昵称」
  const replyToName = item.replyToUserId && item.replyToUserId !== suppressReplyToUserId && nameMap
    ? (nameMap[item.replyToUserId] || '')
    : ''
  return Object.assign({}, item, {
    author,
    mark: ((author && author.nickname) || '途').slice(0, 1),
    createdAtText: fmtCommentDate(item.createdAt),
    // 小红书式：帖子作者发言带「作者」徽标
    isAuthor: !!(postAuthorId && author && author.userId === postAuthorId),
    replyToName,
  })
}

// 小红书式楼中楼：接口平铺返回全部评论，这里按 parentCommentId 归组，
// 子回复挂在主评论下缩进展示；父评论已被删除的孤儿回复提升为主评论
function buildComments(list, postAuthorId) {
  const rows = list || []
  const nameMap = {}
  rows.forEach((item) => {
    if (item.author && item.author.userId && item.author.nickname) nameMap[item.author.userId] = item.author.nickname
  })
  // 本页存在的评论 id 集合 + 各父评论作者的 userId（用于抑制重复 @）
  const exists = {}
  const parentAuthor = {}
  rows.forEach((item) => {
    exists[item.commentId] = true
    if (!item.parentCommentId || !exists[item.parentCommentId]) parentAuthor[item.commentId] = item.author && item.author.userId
  })
  const parents = []
  const children = {}
  rows.forEach((item) => {
    const hasParent = !!(item.parentCommentId && exists[item.parentCommentId])
    const decorated = decorateComment(item, postAuthorId, nameMap, hasParent ? parentAuthor[item.parentCommentId] : undefined)
    if (hasParent) {
      ;(children[item.parentCommentId] = children[item.parentCommentId] || []).push(decorated)
    } else {
      parents.push(decorated)
    }
  })
  parents.forEach((parent) => {
    parent.replies = children[parent.commentId] || []
    parent.expanded = false
  })
  return parents
}

Page(makePage(-1, {
  data: { post: null, comments: [], loading: true, error: '', input: '', sending: false, authorMark: '途', statusBarHeight: 20, navBarHeight: 44, mediaIndex: 0, mediaWindow: [], replyName: '' },
  onLoad(options) { this.postId = options.id; this.setNavMetrics(); this.load() },
  setNavMetrics() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      const statusBarHeight = windowInfo.statusBarHeight || 20
      const navBarHeight = menuButton && menuButton.height
        ? (menuButton.top - statusBarHeight) * 2 + menuButton.height
        : 44
      this.setData({ statusBarHeight, navBarHeight })
    } catch (e) {}
  },
  async load() {
    this.setData({ loading: true, error: '' })
    try {
      const [rawPost, comments] = await Promise.all([api.getCommunityPost(this.postId), api.listPostComments(this.postId, { page: 1, pageSize: 50 })])
      const post = resolvePost(rawPost)
      // 同款卡片兜底：subtitle/coverUrl 缺失时给空串和默认封面，避免渲染 "null"
      const fallbackCover = '../../assets/covers/box1.jpg'
      ;['linkedBox', 'linkedTrip', 'linkedCheckin'].forEach((key) => {
        if (post[key]) {
          post[key].subtitle = post[key].subtitle || ''
          post[key].coverUrl = post[key].coverUrl || fallbackCover
        }
      })
      this.setData({
        post,
        authorMark: ((post.author && post.author.nickname) || '途').slice(0, 1),
        comments: buildComments(comments.list, post.author && post.author.userId),
        loading: false,
        mediaIndex: 0,
        mediaWindow: (post.imageUrls || []).map((_, i) => i <= 1),
        replyName: '',
      })
      this.replyTarget = null
      this.hydrateMedia()
    } catch (e) { this.setData({ loading: false, error: '帖子暂时不可见' }) }
  },
  // 图片轮播切换：更新小红书风格的圆点指示器 + 滑动窗口（只渲染当前±1张，避免多图同时解码卡顿）
  onMediaChange(e) {
    const current = e.detail && typeof e.detail.current === 'number' ? e.detail.current : 0
    if (current !== this.data.mediaIndex) {
      const urls = (this.data.post && this.data.post.imageUrls) || []
      this.setData({ mediaIndex: current, mediaWindow: urls.map((_, i) => Math.abs(i - current) <= 1) })
    }
  },
  // 真机 image 渲染层加载不了明文 http 图片：先下载到本地临时文件再替换显示地址；
  // 点赞/收藏返回的 post 会重置图片地址，也需重新执行（有缓存，很快）
  async hydrateMedia() {
    const { post, comments } = this.data
    if (!post) return
    const urls = []
    const slots = []
    ;(post.imageUrls || []).forEach((url, index) => {
      if (url) { urls.push(url); slots.push('post.imageUrls[' + index + ']') }
    })
    if (post.author && post.author.avatarUrl) { urls.push(post.author.avatarUrl); slots.push('post.author.avatarUrl') }
    ;['linkedBox', 'linkedTrip', 'linkedCheckin'].forEach((key) => {
      const cover = post[key] && post[key].coverUrl
      if (cover) { urls.push(cover); slots.push('post.' + key + '.coverUrl') }
    })
    ;(comments || []).forEach((item, index) => {
      const avatar = item.author && item.author.avatarUrl
      if (avatar) { urls.push(avatar); slots.push('comments[' + index + '].author.avatarUrl') }
      ;(item.replies || []).forEach((sub, subIndex) => {
        const subAvatar = sub.author && sub.author.avatarUrl
        if (subAvatar) { urls.push(subAvatar); slots.push('comments[' + index + '].replies[' + subIndex + '].author.avatarUrl') }
      })
    })
    const resolved = await fetchDisplayMediaList(urls)
    const patch = {}
    slots.forEach((path, index) => {
      if (resolved[index] && resolved[index] !== urls[index]) patch[path] = resolved[index]
    })
    if (Object.keys(patch).length) this.setData(patch)
  },
  async toggleLike() { if (!this.data.post) return; try { const post = await api.likeCommunityPost(this.postId, !this.data.post.liked); this.setData({ post: resolvePost(post) }); this.hydrateMedia() } catch (e) {} },
  async toggleCollect() {
    if (!this.data.post) return
    try {
      const post = await api.collectCommunityPost(this.postId, !this.data.post.collected)
      this.setData({ post: resolvePost(post) })
      this.hydrateMedia()
      wx.showToast({ title: post.collected ? '已收藏到旅途收藏夹' : '已取消收藏', icon: 'none' })
    } catch (e) {}
  },
  async followAuthor() {
    if (!this.data.post || !this.data.post.author) return
    try { const author = await api.followCommunityUser(this.data.post.author.userId, !this.data.post.author.followed); this.setData({ 'post.author': resolveAuthor(author) }); this.hydrateMedia() } catch (e) {}
  },
  openAuthorProfile() {
    const author = this.data.post && this.data.post.author
    if (author && author.userId) wx.navigateTo({ url: '/pages/profile/index?id=' + author.userId })
  },
  // 评论区头像点击 → 对方主页
  openUserProfile(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: '/pages/profile/index?id=' + id })
  },
  toggleEmoji() { this.setData({ emojiOpen: !this.data.emojiOpen }) },
  onEmojiSelect(e) { this.setData({ input: (this.data.input || '') + e.detail.emoji }) },
  goBack() { wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/community/index' }) }) },
  openBox(e) { wx.navigateTo({ url: '/pages/product/detail?id=' + e.currentTarget.dataset.id }) },
  openTrip(e) { wx.navigateTo({ url: '/pages/trips/detail?id=' + e.currentTarget.dataset.id }) },
  openCheckin(e) { wx.navigateTo({ url: '/pages/checkin/detail?id=' + e.currentTarget.dataset.id }) },
  inputChange(e) { this.setData({ input: e.detail.value }) },
  // 小红书式回复：点「回复」锁定目标，输入框提示变化，发送时带 parentCommentId / replyToUserId
  reply(e) {
    const index = Number(e.currentTarget.dataset.index)
    const parent = this.data.comments[index]
    if (!parent || !parent.author) return
    const rawSub = e.currentTarget.dataset.sub
    let target = { parentCommentId: parent.commentId, replyToUserId: parent.author.userId, name: parent.author.nickname || '途友' }
    if (rawSub !== undefined && rawSub !== null && rawSub !== '') {
      const sub = parent.replies && parent.replies[Number(rawSub)]
      if (sub && sub.author) target = { parentCommentId: parent.commentId, replyToUserId: sub.author.userId, name: sub.author.nickname || '途友' }
    }
    this.replyTarget = target
    this.setData({ replyName: target.name })
  },
  cancelReply() {
    this.replyTarget = null
    this.setData({ replyName: '' })
  },
  // 展开 / 收起某条主评论下的子回复（默认只露前 2 条，同小红书）
  toggleReplies(e) {
    const index = Number(e.currentTarget.dataset.index)
    const parent = this.data.comments[index]
    if (!parent) return
    this.setData({ ['comments[' + index + '].expanded']: !parent.expanded })
  },
  async sendComment() {
    const content = (this.data.input || '').trim(); if (!content || this.data.sending) return
    this.setData({ sending: true })
    try {
      const target = this.replyTarget || {}
      const comment = await api.createPostComment(this.postId, {
        content,
        parentCommentId: target.parentCommentId || undefined,
        replyToUserId: target.replyToUserId || undefined,
      })
      this.applyNewComment(comment)
      this.setData({ input: '', sending: false, 'post.commentCount': this.data.post.commentCount + 1 })
      this.hydrateMedia()
    } catch (e) { this.setData({ sending: false }) }
  },
  // 新评论按楼中楼规则本地插入：回复进对应主评论的子列表并自动展开，普通评论追加尾部
  applyNewComment(comment) {
    const postAuthorId = this.data.post && this.data.post.author && this.data.post.author.userId
    const decorated = decorateComment(comment, postAuthorId, {})
    decorated.replies = []
    const target = this.replyTarget
    if (target && target.parentCommentId) {
      const index = this.data.comments.findIndex((item) => item.commentId === target.parentCommentId)
      if (index >= 0) {
        const parent = this.data.comments[index]
        this.setData({
          ['comments[' + index + '].replies']: parent.replies.concat(decorated),
          ['comments[' + index + '].expanded']: true,
        })
        this.cancelReply()
        return
      }
    }
    this.setData({ comments: this.data.comments.concat(decorated) })
    this.cancelReply()
  },
  onShareAppMessage() { return { title: this.data.post ? this.data.post.title : '途个惊喜', path: '/pages/community/post-detail?id=' + this.postId } },
}))
