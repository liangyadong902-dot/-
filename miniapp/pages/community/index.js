const makePage = require('../../behaviors/tuge-page')
const api = require('../../services/api')
const { resolveMedia, fetchDisplayMediaList } = require('../../utils/request')

const RATIOS = [1.26, 1.04, 1.42, 1.18, 1.34, 1.08]

function decoratePosts(list) {
  return (list || []).map((post, index) => ({
    ...post,
    ratio: RATIOS[index % RATIOS.length],
    tagText: (post.topic && post.topic.name) || '旅途',
    authorMark: ((post.author && post.author.nickname) || '途').slice(0, 1),
    authorAvatar: resolveMedia((post.author && post.author.avatarUrl) || ''),
    cover: post.imageUrls && post.imageUrls.length ? resolveMedia(post.imageUrls[0]) : '',
  }))
}

Page(makePage(2, {
  data: {
    loading: true, error: '',
    view: 'discover', category: 'all', topicId: null,
    categories: [{ key: 'all', label: '推荐', topicId: null }],
    posts: [], topics: [], creators: [],
  },
  onLoad() { this.loadAll() },
  onStoreShow() {
    if (this.data.error || !this.data.posts.length) this.loadAll()
  },
  onPullDownRefresh() { this.loadAll().finally(() => wx.stopPullDownRefresh()) },
  async loadAll() {
    const view = this.data.view
    this.setData({ loading: true, error: '' })
    try {
      if (view === 'topics') {
        const topics = await api.listTopics({ page: 1, pageSize: 20 })
        this.setData({
          topics: (topics.list || []).map((item, index) => ({
            topicId: item.topicId,
            name: item.name,
            desc: item.description || '发现同路人的新鲜旅途',
            views: (item.postCount || 0) + ' 篇',
            rankText: String(index + 1).padStart(2, '0'),
          })),
          loading: false,
        })
        return
      }
      if (view === 'creators') {
        const creators = await api.listCreators({ metric: 'influence', period: 'all', page: 1, pageSize: 50 })
        this.setData({
          creators: (creators || []).map((item) => {
            const user = item.user || item
            return {
              userId: user.userId,
              nickname: user.nickname || '途友',
              mark: (user.nickname || '途').slice(0, 1),
              avatar: resolveMedia(user.avatarUrl || ''),
              bio: (item.postCount || 0) + ' 篇笔记 · ' + (item.checkinCount || 0) + ' 次打卡',
              followed: !!user.followed,
            }
          }),
          loading: false,
        })
        this.hydrateCreatorsMedia()
        return
      }
      const postsRequest = view === 'collections'
        ? api.listCollections({ page: 1, pageSize: 50 })
        : api.listCommunityPosts({ view, topicId: this.data.topicId || undefined, sort: 'recent', page: 1, pageSize: 20 })
      const [posts, topics] = await Promise.all([
        postsRequest,
        api.listTopics({ page: 1, pageSize: 10 }),
      ])
      const categories = [{ key: 'all', label: '推荐', topicId: null }].concat(
        (topics.list || []).map((item) => ({ key: 'topic-' + item.topicId, label: item.name, topicId: item.topicId }))
      )
      this.setData({ posts: decoratePosts(posts.list), categories, loading: false })
      this.hydratePostsMedia()
    } catch (e) {
      this.setData({ loading: false, error: '社区暂时没有连上，稍后再试' })
    }
  },
  // 真机 image 渲染层加载不了明文 http 图片：先下载到本地临时文件再替换显示地址
  async hydratePostsMedia() {
    const view = this.data.view
    const posts = this.data.posts
    if (!posts.length) return
    const urls = []
    posts.forEach((post) => {
      if (post.cover) urls.push(post.cover)
      if (post.authorAvatar) urls.push(post.authorAvatar)
    })
    const resolved = await fetchDisplayMediaList(urls)
    if (this.data.view !== view) return
    const mapping = {}
    urls.forEach((url, index) => { mapping[url] = resolved[index] })
    const patch = {}
    posts.forEach((post, index) => {
      const cover = post.cover && mapping[post.cover]
      const avatar = post.authorAvatar && mapping[post.authorAvatar]
      if (cover && cover !== post.cover) patch['posts[' + index + '].cover'] = cover
      if (avatar && avatar !== post.authorAvatar) patch['posts[' + index + '].authorAvatar'] = avatar
    })
    if (Object.keys(patch).length) this.setData(patch)
  },
  async hydrateCreatorsMedia() {
    const view = this.data.view
    const creators = this.data.creators
    if (!creators.length) return
    const urls = creators.map((item) => item.avatar).filter(Boolean)
    const resolved = await fetchDisplayMediaList(urls)
    if (this.data.view !== view) return
    const mapping = {}
    urls.forEach((url, index) => { mapping[url] = resolved[index] })
    const patch = {}
    creators.forEach((item, index) => {
      const avatar = item.avatar && mapping[item.avatar]
      if (avatar && avatar !== item.avatar) patch['creators[' + index + '].avatar'] = avatar
    })
    if (Object.keys(patch).length) this.setData(patch)
  },
  switchView(e) {
    const view = e.currentTarget.dataset.view
    if (view === this.data.view) return
    this.setData({ view, category: 'all', topicId: null, posts: [] }, () => this.loadAll())
  },
  setCategory(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.category) return
    this.setData({ category: key, topicId: e.currentTarget.dataset.topic || null }, () => this.loadAll())
  },
  enterTopic(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    this.setData({ view: 'discover', category: 'topic-' + id, topicId: id }, () => this.loadAll())
    wx.showToast({ title: '已进入 #' + name, icon: 'none' })
  },
  showCollections() {
    if (this.data.view === 'collections') return
    this.setData({ view: 'collections', category: 'all', topicId: null, posts: [] }, () => this.loadAll())
  },
  goCreators() { this.setData({ view: 'creators', posts: [] }, () => this.loadAll()) },
  goDiscover() { this.setData({ view: 'discover', category: 'all', topicId: null, posts: [] }, () => this.loadAll()) },
  async toggleLike(e) {
    const index = Number(e.currentTarget.dataset.index)
    const post = this.data.posts[index]
    if (!post) return
    const next = !post.liked
    const count = Math.max(0, Number(post.likeCount || 0) + (next ? 1 : -1))
    this.setData({ ['posts[' + index + '].liked']: next, ['posts[' + index + '].likeCount']: count })
    try {
      const result = await api.likeCommunityPost(post.postId, next)
      if (result && typeof result.likeCount === 'number') {
        this.setData({ ['posts[' + index + '].likeCount']: result.likeCount })
      }
    } catch (err) {
      this.setData({ ['posts[' + index + '].liked']: !next, ['posts[' + index + '].likeCount']: post.likeCount })
      wx.showToast({ title: '点赞没有成功，再试一次', icon: 'none' })
    }
  },
  async toggleFollow(e) {
    const index = Number(e.currentTarget.dataset.index)
    const creator = this.data.creators[index]
    if (!creator) return
    const next = !creator.followed
    this.setData({ ['creators[' + index + '].followed']: next })
    try {
      await api.followCommunityUser(creator.userId, next)
      wx.showToast({ title: next ? '已关注 ' + creator.nickname : '已取消关注', icon: 'none' })
    } catch (err) {
      this.setData({ ['creators[' + index + '].followed']: !next })
      wx.showToast({ title: '关注没有成功，再试一次', icon: 'none' })
    }
  },
  openPost(e) { wx.navigateTo({ url: '/pages/community/post-detail?id=' + e.currentTarget.dataset.id }) },
  openPublish() { wx.navigateTo({ url: '/pages/community/publish' }) },
}))
