<template>
  <section class="view on">
    <div class="special-block">
      <div class="special-photo">
        <img v-if="hot.img" :src="hot.img" alt="" />
        <div class="v-label">TODAY'S SPECIAL</div>
        <div class="photo-tag">BAKERY<br>HANDMADE</div>
        <div class="fresh-orb">今日<br>新鲜出炉</div>
      </div>
      <div class="special-copy">
        <div class="eyebrow">TODAY'S SPECIAL</div>
        <h2>{{ hot.name }}</h2>
        <p>{{ hot.desc }}<br>开盒 {{ hot.opens }} 次 · 保底 ￥{{ hot.guarantee }}</p>
        <button class="link-cta" type="button" @click="router.push('/boxes')">去货架维护 →</button>
        <div class="kpi-strip">
          <div class="kpi"><b>0</b><span>今日开盒</span></div>
          <div class="kpi"><b>￥0</b><span>今日成交</span></div>
          <div class="kpi"><b>—</b><span>支付成功</span></div>
        </div>
      </div>
    </div>

    <div class="cat-row">
      <button
        v-for="item in cats"
        :key="item.id"
        class="cat-item"
        type="button"
        @click="router.push(item.path)"
      >
        <div class="cat-icon"><CatIcon :kind="item.id" /></div>
        <strong>{{ item.name }}</strong>
        <em>{{ item.en }}</em>
      </button>
    </div>

    <div class="member-banner">
      <div class="copy">
        <div class="kicker">MEMBER BENEFITS</div>
        <h3>待审核退款 {{ kitchen.waitingRefunds }} 笔</h3>
        <button class="btn-ink" type="button" style="height:30px;padding:0 12px;font-size:12px;" @click="router.push('/refunds')">立即处理</button>
      </div>
      <img v-if="kitchen.banners[0]?.img" :src="kitchen.banners[0].img" alt="" />
    </div>

    <div class="section-header">
      <div class="section-title">
        人气货架
        <HeartSvg :size="12" />
      </div>
      <button class="view-more" type="button" @click="router.push('/boxes')">查看更多 →</button>
    </div>
    <div class="product-grid trio">
      <ProductCard
        v-for="(b, i) in kitchen.topBoxes"
        :key="b.id"
        :img="b.img"
        :badge="'TOP' + (i + 1)"
      >
        <div class="prod-name">{{ b.name }}</div>
        <div class="prod-desc">开盒 {{ b.opens }} 次 · {{ kitchen.catLabel(b.category) }}</div>
        <div class="prod-bottom">
          <div class="prod-price"><span>￥</span>{{ b.price }}</div>
          <button class="btn-add" type="button" @click="kitchen.editBox(b.id)">+</button>
        </div>
      </ProductCard>
      <div v-if="!kitchen.topBoxes.length" class="empty" style="grid-column:1/-1">还没有上架盲盒</div>
    </div>

    <div class="two-col">
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:8px;">近 7 日开盒</div>
        <div class="spark">
          <i v-for="(n, i) in spark" :key="i" :style="{ height: n + '%' }" />
        </div>
        <div class="spark-cap"><span>09-11</span><span>09-17</span></div>
      </div>
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:4px;">今日待办</div>
        <div v-for="row in todos" :key="row.label" class="todo-row">
          <span>{{ row.label }}</span>
          <button class="linkish" type="button" @click="router.push(row.path)">{{ row.value }} →</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useKitchenStore } from '@/stores/kitchen'
import CatIcon from '@/components/kitchen/CatIcon.vue'
import HeartSvg from '@/components/kitchen/HeartSvg.vue'
import ProductCard from '@/components/kitchen/ProductCard.vue'

const router = useRouter()
const kitchen = useKitchenStore()
const spark = [0, 0, 0, 0, 0, 0, 0]
const cats = [
  { id: 'boxes' as const, name: '盲盒', en: 'BOX', path: '/boxes' },
  { id: 'routes' as const, name: '线路', en: 'ROUTE', path: '/routes' },
  { id: 'orders' as const, name: '订单', en: 'ORDER', path: '/orders' },
  { id: 'refunds' as const, name: '退款', en: 'GIFT', path: '/refunds' },
]

const hot = computed(() => kitchen.specialBox)
const todos = computed(() => [
  { label: '待支付超时', value: '0 笔', path: '/orders' },
  { label: '待审核退款', value: kitchen.waitingRefunds + ' 笔', path: '/refunds' },
  { label: '抽奖失败自动退', value: '0 笔', path: '/refunds' },
  { label: '线路池', value: '阶段二', path: '/routes' },
])
</script>
