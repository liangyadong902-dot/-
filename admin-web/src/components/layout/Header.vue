<template>
  <header class="cloud-head">
    <LampSvg kind="head" />
    <div class="scallop-row">
      <i
        v-for="(s, i) in scallops"
        :key="i"
        :style="{ left: s.left, width: s.width, height: s.height }"
      />
    </div>
    <div class="head-row">
      <div class="greet">
        <div class="cursive-wrap" style="display:flex;align-items:flex-start;gap:6px;">
          <div class="cursive">{{ greet }}</div>
          <LeafSvg :size="14" />
        </div>
        <h1>{{ route.meta.title }}</h1>
        <div class="sub">{{ route.meta.sub }}</div>
      </div>
      <div class="head-tools">
        <div class="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B3A698" stroke-width="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input v-model="query" placeholder="今天想找什么盒子 / 订单？" @keyup.enter="search" />
          <button class="btn-search" type="button" @click="search">搜索</button>
        </div>
        <button class="icon-btn" type="button" title="待办" @click="router.push('/refunds')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="8" width="18" height="13" rx="2" />
            <path d="M12 8v13M3 12h18" />
            <path d="M12 8c-2-3 2-5 4-3s0 3-4 3z" />
          </svg>
        </button>
        <div class="mascot-mini">
          <div class="speech">今天也要好好出发呀！</div>
          <HeaderMascot />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKitchenStore } from '@/stores/kitchen'
import { toast } from '@/utils/toast'
import { hourGreet } from '@/utils/greet'
import LampSvg from '@/components/kitchen/LampSvg.vue'
import LeafSvg from '@/components/kitchen/LeafSvg.vue'
import HeaderMascot from '@/components/kitchen/HeaderMascot.vue'

const route = useRoute()
const router = useRouter()
const kitchen = useKitchenStore()
const greet = hourGreet()
const query = ref('')

const scallops = Array.from({ length: 10 }, (_, i) => ({
  left: `${i * 11 - 2}%`,
  width: `${58 + (i % 3) * 10}px`,
  height: `${26 + (i % 4) * 4}px`,
}))

function search() {
  const q = query.value.trim()
  if (!q) {
    toast('写个盒子名、单号或昵称')
    return
  }
  const box = kitchen.boxes.find((b) => b.name.includes(q))
  const order = kitchen.mergedOrders.find((o) => o.no.includes(q) || (o.user && o.user.includes(q)))
  const user = kitchen.mergedUsers.find((u) => u.name.includes(q) || (u.wxName && u.wxName.includes(q)))
  if (box) {
    router.push('/boxes')
    toast('找到盲盒：' + box.name)
    return
  }
  if (order) {
    router.push('/orders')
    kitchen.showOrder(order.no)
    return
  }
  if (user) {
    router.push('/users')
    kitchen.showUser(user.id)
    return
  }
  toast('橱窗里暂时没有这味')
}
</script>
