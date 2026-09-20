import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getToken } from '@/utils/storage'
import { TITLES } from '@/constants/nav'

const [dashTitle, dashSub] = TITLES.dash
const [boxesTitle, boxesSub] = TITLES.boxes
const [routesTitle, routesSub] = TITLES.routes
const [badgesTitle, badgesSub] = TITLES.badges
const [bannersTitle, bannersSub] = TITLES.banners
const [aiTitle, aiSub] = TITLES.ai
const [quizTitle, quizSub] = TITLES.quiz
const [ordersTitle, ordersSub] = TITLES.orders
const [refundsTitle, refundsSub] = TITLES.refunds
const [tripsTitle, tripsSub] = TITLES.trips
const [usersTitle, usersSub] = TITLES.users
const [statsTitle, statsSub] = TITLES.stats
const [settingsTitle, settingsSub] = TITLES.settings
const [tokensTitle, tokensSub] = TITLES.tokens
const [communityTitle, communitySub] = TITLES.community
const [commentsTitle, commentsSub] = TITLES.comments
const [topicsTitle, topicsSub] = TITLES.topics
const [checkinsTitle, checkinsSub] = TITLES.checkins
const [achievementsTitle, achievementsSub] = TITLES.achievements

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/login.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: dashTitle, sub: dashSub } },
      { path: '/boxes', name: 'Boxes', component: () => import('@/views/boxes/index.vue'), meta: { title: boxesTitle, sub: boxesSub } },
      { path: '/routes', name: 'Routes', component: () => import('@/views/routes/index.vue'), meta: { title: routesTitle, sub: routesSub } },
      { path: '/badges', name: 'Badges', component: () => import('@/views/badges/index.vue'), meta: { title: badgesTitle, sub: badgesSub } },
      { path: '/banners', name: 'Banners', component: () => import('@/views/banners/index.vue'), meta: { title: bannersTitle, sub: bannersSub } },
      { path: '/ai', name: 'Ai', component: () => import('@/views/ai/index.vue'), meta: { title: aiTitle, sub: aiSub } },
      { path: '/quiz', name: 'Quiz', component: () => import('@/views/quiz/index.vue'), meta: { title: quizTitle, sub: quizSub } },
      { path: '/orders', name: 'Orders', component: () => import('@/views/orders/index.vue'), meta: { title: ordersTitle, sub: ordersSub } },
      { path: '/refunds', name: 'Refunds', component: () => import('@/views/refunds/index.vue'), meta: { title: refundsTitle, sub: refundsSub } },
      { path: '/trips', name: 'Trips', component: () => import('@/views/trips/index.vue'), meta: { title: tripsTitle, sub: tripsSub } },
      { path: '/users', name: 'Users', component: () => import('@/views/users/index.vue'), meta: { title: usersTitle, sub: usersSub } },
      { path: '/stats', name: 'Stats', component: () => import('@/views/stats/index.vue'), meta: { title: statsTitle, sub: statsSub } },
      { path: '/tokens', name: 'Tokens', component: () => import('@/views/tokens/index.vue'), meta: { title: tokensTitle, sub: tokensSub } },
      { path: '/settings', name: 'Settings', component: () => import('@/views/settings/index.vue'), meta: { title: settingsTitle, sub: settingsSub } },
      { path: '/community/posts', name: 'CommunityPosts', component: () => import('@/views/community/posts.vue'), meta: { title: communityTitle, sub: communitySub } },
      { path: '/community/comments', name: 'CommunityComments', component: () => import('@/views/community/comments.vue'), meta: { title: commentsTitle, sub: commentsSub } },
      { path: '/community/topics', name: 'CommunityTopics', component: () => import('@/views/community/topics.vue'), meta: { title: topicsTitle, sub: topicsSub } },
      { path: '/checkins', name: 'Checkins', component: () => import('@/views/checkins/index.vue'), meta: { title: checkinsTitle, sub: checkinsSub } },
      { path: '/achievements', name: 'Achievements', component: () => import('@/views/achievements/index.vue'), meta: { title: achievementsTitle, sub: achievementsSub } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = getToken()
  if (to.meta.public) return true
  if (!token) return { path: '/login', query: { redirect: to.fullPath } }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 途个惊喜` : '途个惊喜 · 运营后厨'
})

export default router
