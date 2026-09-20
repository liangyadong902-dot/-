const makePage = require('../../behaviors/tuge-page')
const api = require('../../services/api')

Page(makePage(-1, {
  data: { post: null, comments: [], loading: true, error: '', input: '', sending: false, authorMark: '途' },
  onLoad(options) { this.postId = options.id; this.load() },
  async load() {
    this.setData({ loading: true, error: '' })
    try {
      const [post, comments] = await Promise.all([api.getCommunityPost(this.postId), api.listPostComments(this.postId, { page: 1, pageSize: 50 })])
      this.setData({
        post,
        authorMark: ((post.author && post.author.nickname) || '途').slice(0, 1),
        comments: (comments.list || []).map((item) => ({ ...item, mark: ((item.author && item.author.nickname) || '途').slice(0, 1) })),
        loading: false,
      })
    } catch (e) { this.setData({ loading: false, error: '帖子暂时不可见' }) }
  },
  async toggleLike() { if (!this.data.post) return; try { const post = await api.likeCommunityPost(this.postId, !this.data.post.liked); this.setData({ post }) } catch (e) {} },
  async toggleCollect() {
    if (!this.data.post) return
    try {
      const post = await api.collectCommunityPost(this.postId, !this.data.post.collected)
      this.setData({ post })
      wx.showToast({ title: post.collected ? '已收藏到旅途收藏夹' : '已取消收藏', icon: 'none' })
    } catch (e) {}
  },
  async followAuthor() {
    if (!this.data.post || !this.data.post.author) return
    try { const author = await api.followCommunityUser(this.data.post.author.userId, !this.data.post.author.followed); this.setData({ 'post.author': author }) } catch (e) {}
  },
  goBack() { wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/community/index' }) }) },
  openBox(e) { wx.navigateTo({ url: '/pages/product/detail?id=' + e.currentTarget.dataset.id }) },
  openTrip(e) { wx.navigateTo({ url: '/pages/trips/detail?id=' + e.currentTarget.dataset.id }) },
  openCheckin(e) { wx.navigateTo({ url: '/pages/checkin/detail?id=' + e.currentTarget.dataset.id }) },
  inputChange(e) { this.setData({ input: e.detail.value }) },
  async sendComment() {
    const content = (this.data.input || '').trim(); if (!content || this.data.sending) return
    this.setData({ sending: true })
    try {
      const comment = await api.createPostComment(this.postId, { content })
      this.setData({ comments: this.data.comments.concat({ ...comment, mark: ((comment.author && comment.author.nickname) || '途').slice(0, 1) }), input: '', sending: false, 'post.commentCount': this.data.post.commentCount + 1 })
    } catch (e) { this.setData({ sending: false }) }
  },
  reply(e) { this.setData({ input: '@' + (e.currentTarget.dataset.name || '') + ' ' }) },
  onShareAppMessage() { return { title: this.data.post ? this.data.post.title : '途个惊喜', path: '/pages/community/post-detail?id=' + this.postId } },
}))
