<template>
  <KitchenDrawer :open="!!kitchen.drawer" @close="kitchen.closeDrawer()">
    <template v-if="kitchen.drawer?.type === 'box' && boxForm">
      <h3>{{ boxIsNew ? '新出炉的盒子' : '编辑盲盒' }}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:16px;">封面沿用旅行照片，不画假面包</p>
      <div class="form-grid">
        <div class="field span2"><label>名称</label><input v-model="boxForm.name" /></div>
        <div class="field">
          <label>分类</label>
          <select v-model="boxForm.category">
            <option v-for="(label, key) in CAT" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="field"><label>展示标签</label><input v-model="boxForm.tag" /></div>
        <div class="field"><label>售价</label><input v-model.number="boxForm.price" type="number" /></div>
        <div class="field"><label>保底价值</label><input v-model.number="boxForm.guarantee" type="number" /></div>
        <div class="field span2"><label>简介</label><input v-model="boxForm.desc" /></div>
        <div class="field span2">
          <label>适配心情</label>
          <div class="moods">
            <label v-for="(label, key) in MOOD" :key="key" class="check">
              <input type="checkbox" :value="key" :checked="boxForm.moods.includes(key as Mood)" @change="toggleMood(key as Mood)" />
              {{ label }}
            </label>
          </div>
        </div>
        <div class="field">
          <label>状态</label>
          <select v-model="boxForm.status">
            <option value="on">上架</option>
            <option value="off">下架</option>
          </select>
        </div>
        <div class="field"><label>排序</label><input v-model.number="boxForm.sort" type="number" /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveBox">放入货架</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'route' && routeForm">
      <h3>{{ routeIsNew ? '新线路' : '编辑线路' }}</h3>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field span2"><label>名称</label><input v-model="routeForm.name" /></div>
        <div class="field"><label>目的地</label><input v-model="routeForm.dest" /></div>
        <div class="field">
          <label>分类</label>
          <select v-model="routeForm.category">
            <option v-for="(label, key) in CAT" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="field"><label>票面价值</label><input v-model.number="routeForm.value" type="number" /></div>
        <div class="field"><label>采购价</label><input v-model.number="routeForm.cost" type="number" /></div>
        <div class="field"><label>场景</label><input v-model="routeForm.scene" placeholder="mountain / food" /></div>
        <div class="field">
          <label>徽章</label>
          <select v-model="routeForm.badge">
            <option v-for="b in kitchen.badges" :key="b.name">{{ b.name }}</option>
          </select>
        </div>
        <div class="field span2"><label>亮点</label><input v-model="routeForm.highlights" /></div>
        <div class="field span2"><label>包含</label><input v-model="routeForm.includes" /></div>
        <div class="field span2"><label>情绪文案</label><input v-model="routeForm.moodText" /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveRoute">保存</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'pool'">
      <h3>线路池校验</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">
        {{ poolBox?.name || '当前盲盒' }} · 票面价值须覆盖保底
      </p>
      <div v-if="kitchen.poolLoading" class="empty">正在读取线路池…</div>
      <template v-else>
        <div class="pill" :class="kitchen.poolOk ? 'ok' : 'wait'" style="display:inline-block;margin-bottom:12px;">
          {{ kitchen.poolOk ? '保底校验通过' : '没有满足保底的上架线路' }}
        </div>
        <div v-for="route in kitchen.poolRoutes" :key="route.id" class="kv">
          <span>{{ route.name }} · {{ route.destination }}</span>
          <strong :style="{ color: route.meetsGuarantee ? 'var(--sage-deep)' : 'var(--muted)' }">
            ￥{{ route.value }} · {{ route.meetsGuarantee ? '满足保底' : '不满足' }}
          </strong>
        </div>
        <div v-if="!kitchen.poolRoutes.length" class="empty">当前分类没有线路</div>
      </template>
      <button class="btn-ghost btn-block" style="margin-top:18px;" type="button" @click="kitchen.closeDrawer()">收起</button>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'badge' && badgeForm">
      <h3>{{ badgeIsNew ? '新建徽章' : '编辑徽章' }}</h3>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field"><label>印章字（最多 4 字）</label><input v-model="badgeForm.mark" maxlength="4" /></div>
        <div class="field"><label>名称</label><input v-model="badgeForm.name" /></div>
        <div class="field span2"><label>描述</label><input v-model="badgeForm.description" /></div>
        <div class="field"><label>排序</label><input v-model.number="badgeForm.sortWeight" type="number" /></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveBadge">保存徽章</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="kitchen.drawer?.type === 'banner' && bannerForm">
      <h3>{{ bannerIsNew ? '新建运营位' : '编辑运营位' }}</h3>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field span2"><label>标题</label><input v-model="bannerForm.title" /></div>
        <div class="field"><label>副标题</label><input v-model="bannerForm.sub" /></div>
        <div class="field"><label>标签</label><input v-model="bannerForm.tag" /></div>
        <div class="field span2"><label>图片 URL</label><input v-model="bannerForm.img" /></div>
        <div class="field"><label>跳转类型</label><select v-model="bannerForm.jumpType"><option value="none">无跳转</option><option value="category">分类</option><option value="box">盲盒</option><option value="url">外链</option></select></div>
        <div class="field"><label>跳转目标</label><input v-model="bannerForm.jumpTarget" :placeholder="bannerForm.jumpType === 'category' ? 'nearby / province' : '填写目标值'" /></div>
        <div class="field"><label>开始时间</label><input v-model="bannerForm.startAt" type="datetime-local" /></div>
        <div class="field"><label>结束时间</label><input v-model="bannerForm.endAt" type="datetime-local" /></div>
        <div class="field"><label>排序</label><input v-model.number="bannerForm.sortWeight" type="number" /></div>
        <div class="field"><label>状态</label><select v-model="bannerForm.on"><option :value="true">上架</option><option :value="false">下架</option></select></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn-sage" type="button" style="flex:1" @click="saveBanner">保存运营位</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">取消</button>
      </div>
    </template>

    <template v-else-if="orderDetail">
      <h3>订单详情</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">{{ orderDetail.no }}</p>
      <div v-for="row in orderRows" :key="row[0]" class="kv">
        <span>{{ row[0] }}</span>
        <strong>{{ row[1] }}</strong>
      </div>
      <button class="btn-ghost btn-block" style="margin-top:18px;" type="button" @click="kitchen.closeDrawer()">收起</button>
    </template>

    <template v-else-if="userDetail">
      <h3>{{ userDetail.name }}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">
        {{ userDetail.title }} · {{ userDetail.on ? '正常' : '已禁用' }}{{ userDetail.wxName ? ' · 微信 ' + userDetail.wxName : '' }}
      </p>
      <div class="toolbar">
        <button
          v-for="(tab, i) in userTabs"
          :key="tab"
          class="chip"
          :class="{ on: userTab === i }"
          type="button"
          @click="userTab = i"
        >{{ tab }}</button>
      </div>
      <div>
        <div v-for="row in userPanes[userTab]" :key="row[0]" class="kv">
          <span>{{ row[0] }}</span>
          <strong>{{ row[1] }}</strong>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn-ink" type="button" style="flex:1" @click="toggleUser">{{ userDetail.on ? '禁用账号' : '启用账号' }}</button>
        <button class="btn-ghost" type="button" @click="kitchen.closeDrawer()">关闭</button>
      </div>
    </template>
  </KitchenDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import KitchenDrawer from './KitchenDrawer.vue'
import { CAT, MOOD, ORDER_ST } from '@/constants/nav'
import { useKitchenStore } from '@/stores/kitchen'
import { toast } from '@/utils/toast'
import type { BadgeItem, BannerItem, BlindBox, Mood, TravelRoute } from '@/types/kitchen'

const kitchen = useKitchenStore()
const boxForm = ref<BlindBox | null>(null)
const boxIsNew = ref(false)
const routeForm = ref<TravelRoute | null>(null)
const routeIsNew = ref(false)
const badgeForm = ref<BadgeItem | null>(null)
const badgeIsNew = ref(false)
const bannerForm = ref<BannerItem | null>(null)
const bannerIsNew = ref(false)
const userTab = ref(0)
const userTabs = ['身份', '偏好', '资产', '成长']

watch(
  () => kitchen.drawer,
  (d) => {
    if (!d) {
      boxForm.value = null
      routeForm.value = null
      badgeForm.value = null
      bannerForm.value = null
      return
    }
    if (d.type === 'box') {
      const found = kitchen.boxes.find((x) => x.id === d.id)
      boxIsNew.value = !found
      boxForm.value = found
        ? { ...found, moods: [...found.moods] }
        : {
            id: 'box_' + Date.now(),
            name: '',
            category: 'nearby',
            tag: '周边游',
            desc: '',
            price: 99,
            guarantee: 120,
            moods: ['happy'],
            img: kitchen.boxes[0]?.img || '',
            status: 'on',
            sort: 10,
            rank: 'NEW',
            opens: 0,
          }
    }
    if (d.type === 'route') {
      const found = kitchen.routes.find((x) => x.id === d.id)
      routeIsNew.value = !found
      routeForm.value = found
        ? { ...found }
        : {
            id: 'r' + Date.now(),
            name: '',
            dest: '',
            category: 'nearby',
            value: 148,
            cost: null,
            scene: '',
            badge: '古村',
            moodText: '',
            highlights: '',
            includes: '',
            status: 'on',
            img: kitchen.routes[0]?.img || '',
            draws: 0,
          }
    }
    if (d.type === 'user') userTab.value = 0
    if (d.type === 'badge') {
      const found = kitchen.badges.find((x) => x.id === d.id)
      badgeIsNew.value = !found
      badgeForm.value = found
        ? { ...found }
        : { name: '', mark: '', description: '', sortWeight: 0, unlock: 0, routes: 0 }
    }
    if (d.type === 'banner') {
      const found = kitchen.banners.find((x) => x.id === d.id)
      bannerIsNew.value = !found
      bannerForm.value = found
        ? { ...found }
        : {
            id: 'banner_' + Date.now(), title: '', sub: '', tag: '', to: '', on: true,
            img: '', jumpType: 'none', jumpTarget: null, startAt: null, endAt: null, sortWeight: 0,
          }
    }
  },
  { immediate: true },
)

function toggleMood(key: Mood) {
  if (!boxForm.value) return
  const i = boxForm.value.moods.indexOf(key)
  if (i >= 0) boxForm.value.moods.splice(i, 1)
  else boxForm.value.moods.push(key)
}

function saveBox() {
  if (!boxForm.value) return
  const next = {
    ...boxForm.value,
    name: boxForm.value.name.trim() || '未命名盲盒',
  }
  kitchen.saveBox(next, boxIsNew.value)
}

function saveRoute() {
  if (!routeForm.value) return
  kitchen.saveRoute({
    ...routeForm.value,
    name: routeForm.value.name.trim() || '未命名线路',
  })
}

function saveBadge() {
  if (!badgeForm.value) return
  kitchen.saveBadge({ ...badgeForm.value, name: badgeForm.value.name.trim(), mark: badgeForm.value.mark.trim() }, badgeIsNew.value)
}

function saveBanner() {
  if (!bannerForm.value) return
  kitchen.saveBanner({ ...bannerForm.value, title: bannerForm.value.title.trim() }, bannerIsNew.value)
}

const poolBox = computed(() => {
  const d = kitchen.drawer
  if (d?.type !== 'pool') return null
  return kitchen.boxes.find((box) => box.id === d.id) || null
})

const orderDetail = computed(() => {
  const d = kitchen.drawer
  if (d?.type !== 'order') return null
  return kitchen.mergedOrders.find((x) => x.no === d.no) || null
})

const orderRows = computed(() => {
  const o = orderDetail.value
  if (!o) return []
  const [lab] = ORDER_ST[o.st]
  return [
    ['用户', [o.user, kitchen.wxNickOf(o) ? '微信名 ' + kitchen.wxNickOf(o) : '', o.phone].filter(Boolean).join(' · ')],
    ['盲盒快照', o.box],
    ['实付', '￥' + o.pay],
    ['渠道', o.ch],
    ['状态', lab],
    ['开盒结果', o.route],
    ['下单时间', o.time],
  ]
})

const userDetail = computed(() => {
  const d = kitchen.drawer
  if (d?.type !== 'user') return null
  return kitchen.mergedUsers.find((x) => x.id === d.id) || null
})

const userPanes = computed(() => {
  const u = userDetail.value
  if (!u) return []
  return [
    [['用户 ID', u.id], ['微信名', u.wxName || (u.ch === '微信' ? u.name : '未绑定微信')], ['手机', u.phone || '未绑定'], ['渠道', u.ch], ['最近登录', u.last], ['状态', u.on ? '正常' : '禁用']],
    [['最近心情', kitchen.moodLabel(u.mood)], ['旅行人格', u.person], ['常驻', '未填']],
    [['有效订单', u.trips + ' 笔'], ['聊天 / 日记', '摘要见正式环境'], ['徽章', '见行程解锁']],
    [['出行次数', u.trips], ['累计消费', '￥' + u.spend], ['累计省钱', '￥' + u.saved], ['公益里程', u.trips + ' km']],
  ]
})

function toggleUser() {
  const u = userDetail.value
  if (!u) return
  u.on = !u.on
  kitchen.closeDrawer()
  toast(u.on ? '已启用' : '已禁用，不可开盒')
}
</script>
