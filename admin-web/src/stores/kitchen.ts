import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { CAT, MOOD } from '@/constants/nav'
import {
  createAdminBox,
  createAdminBadge,
  createAdminBanner,
  createAdminRoute,
  deleteAdminBanner,
  deleteAdminBox,
  deleteAdminRoute,
  getAdminBoxPool,
  listAdminBadges,
  listAdminBanners,
  listAdminBoxes,
  listAdminRoutes,
  updateAdminBannerStatus,
  updateAdminBanner,
  updateAdminBadge,
  updateAdminBox,
  updateAdminBoxStatus,
  updateAdminRoute,
  updateAdminRouteStatus,
  type ApiAdminBox,
  type ApiAdminBanner,
  type ApiAdminRoute,
  type ApiRoutePool,
  type ApiBanner,
  type ApiBlindBox,
} from '@/api/content'
import type {
  AiRecipe,
  BadgeItem,
  BannerItem,
  BlindBox,
  Category,
  DrawerState,
  GuestLike,
  GuestUser,
  KitchenSettings,
  Mood,
  OrderItem,
  QuizItem,
  RefundItem,
  RefundStatus,
  TravelRoute,
  TripItem,
  PersonType,
} from '@/types/kitchen'
import { toast } from '@/utils/toast'
import {
  approveAdminRefund,
  listAdminOrders,
  listAdminRefunds,
  rejectAdminRefund,
} from '@/api/transaction'

const EMPTY_BOX: BlindBox = {
  id: '',
  rank: '',
  name: '暂无上架盲盒',
  category: 'nearby',
  tag: '',
  desc: '',
  price: 0,
  guarantee: 0,
  moods: [],
  img: '',
  status: 'on',
  sort: 0,
  opens: 0,
}

function mapBox(row: ApiBlindBox | ApiAdminBox): BlindBox {
  return {
    id: String(row.id),
    rank: row.rankTag || '',
    name: row.name,
    category: row.category,
    tag: row.tag,
    desc: row.intro,
    price: row.price,
    guarantee: row.minValue,
    moods: (row.moods || []) as Mood[],
    img: row.coverUrl || '',
    status: row.status,
    sort: 'sortWeight' in row ? row.sortWeight : 0,
    opens: 'openCount' in row ? row.openCount : 0,
  }
}

function jumpLabel(row: ApiBanner): string {
  if (!row.jumpType || row.jumpType === 'none') return '无跳转'
  if (row.jumpType === 'category') {
    const key = row.jumpTarget as Category
    return '分类:' + (CAT[key] || row.jumpTarget || '')
  }
  if (row.jumpType === 'box') return '盲盒 #' + (row.jumpTarget || '')
  return row.jumpTarget || '外链'
}

function mapBanner(row: ApiAdminBanner): BannerItem {
  return {
    id: String(row.id),
    title: row.title,
    sub: row.subTitle || '',
    tag: row.tag || '',
    to: jumpLabel(row),
    on: row.status === 'on',
    img: row.imageUrl || '',
    jumpType: row.jumpType,
    jumpTarget: row.jumpTarget,
    startAt: row.startAt,
    endAt: row.endAt,
    sortWeight: row.sortWeight,
  }
}

function mapRoute(row: ApiAdminRoute): TravelRoute {
  return {
    id: String(row.id),
    name: row.name,
    dest: row.destination,
    category: row.category,
    value: row.value,
    cost: row.cost,
    scene: row.scene,
    badge: row.badgeName,
    moodText: row.moodText,
    highlights: row.highlight,
    includes: row.includes.join('、'),
    status: row.status,
    img: row.imageUrl || '',
    draws: row.drawCount,
    badgeId: row.badgeId,
    guide: (row.guide as TravelRoute['guide']) || undefined,
    guideVersion: row.guideVersion ?? undefined,
  }
}

export const useKitchenStore = defineStore('kitchen', () => {
  const boxes = reactive<BlindBox[]>([])
  const routes = reactive<TravelRoute[]>([])
  const badges = reactive<BadgeItem[]>([])
  const banners = reactive<BannerItem[]>([])
  const orders = reactive<OrderItem[]>([])
  const refunds = reactive<RefundItem[]>([])
  const trips = reactive<TripItem[]>([])
  const users = reactive<GuestUser[]>([])
  const quiz = reactive<QuizItem[]>([])
  const persons = reactive<PersonType[]>([])
  const ai = reactive<AiRecipe>({
    greet: '',
    prompt: '',
    quick: [],
    fallback: [],
    diary: '',
  })
  const settings = reactive<KitchenSettings>({
    guarantee: '',
    moodCopy: '',
    village: 0,
    timeout: 0,
    levels: [],
  })
  const filters = reactive({ boxCat: 'all', boxSt: 'all', orderSt: 'all', boxKeyword: '', routeKeyword: '' })
  const drawer = ref<DrawerState>(null)
  const poolRoutes = ref<ApiRoutePool['routes']>([])
  const poolOk = ref(false)
  const poolLoading = ref(false)
  const loaded = ref(false)
  const catalogError = ref('')
  const transactionsError = ref('')
  const transactionsLoading = ref(false)

  function wxNickOf(obj: GuestLike | null | undefined) {
    if (!obj) return ''
    if (obj.wxName) return obj.wxName
    if (obj.loginCh === '微信' || obj.ch === '微信' || obj.channel === '微信') {
      return obj.name || obj.user || obj.nickname || ''
    }
    return ''
  }

  const mergedUsers = computed(() => [...users])
  const mergedOrders = computed(() => [...orders])
  const mergedRefunds = computed(() => [...refunds])
  const mergedTrips = computed(() => [...trips])
  const waitingRefunds = computed(() => mergedRefunds.value.filter((r) => r.st === 'wait').length)
  const specialBox = computed(() => boxes[1] || boxes[0] || EMPTY_BOX)
  const topBoxes = computed(() => boxes.slice(0, 3))

  const filteredBoxes = computed(() => {
    const kw = filters.boxKeyword.trim().toLowerCase()
    return boxes.filter((b) => {
      const cat = filters.boxCat === 'all' || b.category === filters.boxCat
      const st = filters.boxSt === 'all' || b.status === filters.boxSt
      const key = !kw || b.name.toLowerCase().includes(kw) || b.desc.toLowerCase().includes(kw)
      return cat && st && key
    })
  })

  const filteredRoutes = computed(() => {
    const kw = filters.routeKeyword.trim().toLowerCase()
    if (!kw) return routes
    return routes.filter((r) =>
      r.name.toLowerCase().includes(kw)
      || r.dest.toLowerCase().includes(kw)
      || (r.moodText || '').toLowerCase().includes(kw))
  })

  const filteredOrders = computed(() =>
    mergedOrders.value.filter((o) => filters.orderSt === 'all' || o.st === filters.orderSt),
  )

  async function loadCatalog() {
    catalogError.value = ''
    const [boxRes, routeRes, bannerRes, badgeRes] = await Promise.allSettled([
      listAdminBoxes({ page: 1, pageSize: 100 }),
      listAdminRoutes({ page: 1, pageSize: 100 }),
      listAdminBanners({ page: 1, pageSize: 100 }),
      listAdminBadges({ page: 1, pageSize: 100 }),
    ])
    if (boxRes.status === 'fulfilled') {
      boxes.splice(0, boxes.length, ...(boxRes.value.data?.list || []).map(mapBox))
    } else {
      boxes.splice(0, boxes.length)
      catalogError.value = '内容数据加载失败，请重试'
    }
    if (routeRes.status === 'fulfilled') {
      routes.splice(0, routes.length, ...(routeRes.value.data?.list || []).map(mapRoute))
    } else {
      routes.splice(0, routes.length)
      catalogError.value = '内容数据加载失败，请重试'
    }
    if (bannerRes.status === 'fulfilled') {
      banners.splice(0, banners.length, ...(bannerRes.value.data?.list || []).map(mapBanner))
    } else {
      banners.splice(0, banners.length)
      catalogError.value = '内容数据加载失败，请重试'
    }
    if (badgeRes.status === 'fulfilled') {
      badges.splice(
        0,
        badges.length,
        ...(badgeRes.value.data?.list || []).map((b) => ({
          id: String(b.id),
          name: b.name,
          mark: b.mark,
          description: b.description,
          sortWeight: b.sortWeight,
          unlock: b.unlockedCount,
          routes: b.routeCount,
        })),
      )
    } else {
      badges.splice(0, badges.length)
      catalogError.value = '内容数据加载失败，请重试'
    }
    loaded.value = true
    await loadTransactions()
  }

  async function loadTransactions() {
    transactionsLoading.value = true
    transactionsError.value = ''
    try {
      const [orderRes, refundRes] = await Promise.allSettled([
        listAdminOrders({ page: 1, pageSize: 100 }),
        listAdminRefunds({ page: 1, pageSize: 100 }),
      ])
      if (orderRes.status === 'fulfilled') {
        orders.splice(0, orders.length, ...(orderRes.value.data?.list || []).map((row) => ({
          no: row.orderNo,
          user: row.userName || `用户${row.userId}`,
          phone: row.phone || '未绑定',
          box: row.boxName,
          pay: Number(row.paidCent || row.priceCent || 0) / 100,
          ch: row.payChannel === 'mock' ? '支付宝沙箱' : (row.payChannel || '—'),
          st: row.status,
          route: row.routeName || '—',
          time: row.createdAt || '',
        })))
      } else {
        orders.splice(0, orders.length)
        transactionsError.value = '交易数据加载失败，请重试'
      }
      if (refundRes.status === 'fulfilled') {
        refunds.splice(0, refunds.length, ...(refundRes.value.data?.list || []).map((row) => ({
          no: row.refundNo,
          order: row.orderNo,
          user: row.userName || `用户${row.userId}`,
          reason: row.reason,
          amount: Number(row.amountCent || 0) / 100,
          type: row.kind === 'draw_fail' ? '自动' as const : '人工' as const,
          st: row.status === 'pending_review' ? 'wait' as const : row.status === 'rejected' ? 'reject' as const : 'done' as const,
        })))
      } else {
        refunds.splice(0, refunds.length)
        transactionsError.value = '交易数据加载失败，请重试'
      }
    } finally {
      transactionsLoading.value = false
    }
  }

  function closeDrawer() {
    drawer.value = null
  }

  function editBox(id: string | null) {
    drawer.value = { type: 'box', id }
  }

  function editRoute(id: string | null) {
    drawer.value = { type: 'route', id }
  }

  function editBadge(id: string | null) {
    drawer.value = { type: 'badge', id }
  }

  function editBanner(id: string | null) {
    drawer.value = { type: 'banner', id }
  }

  async function showPool(id: string) {
    drawer.value = { type: 'pool', id }
    poolLoading.value = true
    try {
      const result = await getAdminBoxPool(id)
      poolRoutes.value = result.data?.routes || []
      poolOk.value = Boolean(result.data?.ok)
    } catch {
      poolRoutes.value = []
      poolOk.value = false
    } finally {
      poolLoading.value = false
    }
  }

  function showOrder(no: string) {
    drawer.value = { type: 'order', no }
  }

  function showUser(id: number) {
    drawer.value = { type: 'user', id }
  }

  async function saveBox(next: BlindBox, isNew: boolean) {
    const payload = {
      name: next.name,
      category: next.category,
      tag: next.tag,
      rankTag: next.rank || null,
      intro: next.desc,
      price: next.price,
      minValue: next.guarantee,
      coverUrl: next.img,
      moods: next.moods,
      sortWeight: next.sort,
      status: next.status,
    }
    try {
      const res = isNew ? await createAdminBox(payload) : await updateAdminBox(next.id, payload)
      await loadCatalog()
      closeDrawer()
      toast(res.data?.warning || '盲盒已保存')
      return true
    } catch {
      return false
    }
  }

  async function toggleBox(id: string) {
    const box = boxes.find((item) => item.id === id)
    if (!box) return
    try {
      await updateAdminBoxStatus(id, box.status === 'on' ? 'off' : 'on')
      await loadCatalog()
      toast(box.status === 'on' ? '盲盒已下架' : '盲盒已上架')
    } catch {
      return
    }
  }

  async function deleteBox(id: string) {
    try {
      await deleteAdminBox(id)
      await loadCatalog()
      toast('盲盒已删除')
    } catch {
      return
    }
  }

  async function saveRoute(next: TravelRoute) {
    const payload = {
      name: next.name,
      category: next.category,
      destination: next.dest,
      scene: next.scene || '',
      imageUrl: next.img || '',
      value: next.value,
      cost: next.cost ?? null,
      badgeId: next.badgeId || badges.find((badge) => badge.name === next.badge)?.id,
      highlight: next.highlights,
      includes: next.includes.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
      moodText: next.moodText,
      status: next.status,
      guide: next.guide || {},
      guideVersion: next.guideVersion ?? null,
    }
    try {
      if (!payload.badgeId) {
        toast('请先选择有效徽章')
        return false
      }
      if (next.id.startsWith('r')) await createAdminRoute(payload)
      else await updateAdminRoute(next.id, payload)
      await loadCatalog()
      closeDrawer()
      toast('线路已保存')
      return true
    } catch {
      return false
    }
  }

  async function toggleRoute(id: string) {
    const route = routes.find((item) => item.id === id)
    if (!route) return
    try {
      await updateAdminRouteStatus(id, route.status === 'on' ? 'off' : 'on')
      await loadCatalog()
      toast(route.status === 'on' ? '线路已停用' : '线路已启用')
    } catch {
      return
    }
  }

  async function deleteRoute(id: string) {
    try {
      await deleteAdminRoute(id)
      await loadCatalog()
      toast('线路已删除')
    } catch {
      return
    }
  }

  async function toggleBanner(id: string) {
    const banner = banners.find((item) => item.id === id)
    if (!banner) return
    try {
      await updateAdminBannerStatus(id, banner.on ? 'off' : 'on')
      await loadCatalog()
      toast(banner.on ? '运营位已下架' : '运营位已上架')
    } catch {
      return
    }
  }

  async function saveBadge(next: BadgeItem, isNew: boolean) {
    const payload = {
      name: next.name.trim(),
      mark: next.mark.trim(),
      description: next.description || '',
      sortWeight: next.sortWeight || 0,
    }
    try {
      if (isNew) await createAdminBadge(payload)
      else await updateAdminBadge(next.id as string, payload)
      await loadCatalog()
      closeDrawer()
      toast('徽章已保存')
      return true
    } catch {
      return false
    }
  }

  async function saveBanner(next: BannerItem, isNew: boolean) {
    const payload = {
      title: next.title.trim(),
      subTitle: next.sub,
      tag: next.tag,
      imageUrl: next.img,
      jumpType: next.jumpType || 'none',
      jumpTarget: next.jumpTarget || null,
      startAt: next.startAt || null,
      endAt: next.endAt || null,
      sortWeight: next.sortWeight || 0,
      status: next.on ? 'on' : 'off',
    }
    try {
      if (isNew) await createAdminBanner(payload)
      else await updateAdminBanner(next.id, payload)
      await loadCatalog()
      closeDrawer()
      toast('运营位已保存')
      return true
    } catch {
      return false
    }
  }

  async function deleteBanner(id: string) {
    try {
      await deleteAdminBanner(id)
      await loadCatalog()
      toast('运营位已删除')
    } catch {
      return
    }
  }

  async function decideRefund(no: string, st: RefundStatus) {
    try {
      if (st === 'done') await approveAdminRefund(no)
      else await rejectAdminRefund(no)
      await loadTransactions()
      toast(st === 'done' ? '退款已通过' : '退款已驳回')
    } catch {
      return
    }
  }

  function moodLabel(key: string) {
    return MOOD[key as keyof typeof MOOD] || key
  }

  function catLabel(key: string) {
    return CAT[key as Category] || key
  }

  return {
    boxes,
    routes,
    badges,
    banners,
    orders,
    refunds,
    trips,
    users,
    quiz,
    persons,
    ai,
    settings,
    filters,
    drawer,
    poolRoutes,
    poolOk,
    poolLoading,
    loaded,
    catalogError,
    transactionsError,
    transactionsLoading,
    wxNickOf,
    mergedUsers,
    mergedOrders,
    mergedRefunds,
    mergedTrips,
    waitingRefunds,
    specialBox,
    topBoxes,
    filteredBoxes,
    filteredRoutes,
    filteredOrders,
    loadCatalog,
    loadTransactions,
    closeDrawer,
    editBox,
    editRoute,
    editBadge,
    editBanner,
    showPool,
    showOrder,
    showUser,
    saveBox,
    toggleBox,
    deleteBox,
    saveRoute,
    toggleRoute,
    deleteRoute,
    toggleBanner,
    saveBadge,
    saveBanner,
    deleteBanner,
    decideRefund,
    moodLabel,
    catLabel,
  }
})
