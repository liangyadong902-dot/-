<template>
  <section class="view on">
    <PageHead title="行程本" sub="客服查阅用，一般不改" />
    <div class="product-grid">
      <ProductCard v-for="(t, i) in kitchen.mergedTrips" :key="t.route + t.date + i" :dimmed="!t.ok">
        <div class="eyebrow">{{ t.date }} · {{ t.user }}{{ t.wxName ? ' · 微信 ' + t.wxName : '' }}</div>
        <div class="prod-name">{{ t.route }}</div>
        <div class="prod-desc">{{ t.dest }}</div>
        <div class="prod-bottom">
          <div class="prod-price"><span>￥</span>{{ t.val }}</div>
          <span class="pill" :class="t.ok ? 'ok' : 'bad'">{{ t.ok ? '有效' : '已退款' }}</span>
        </div>
      </ProductCard>
      <div v-if="!kitchen.mergedTrips.length" class="empty" style="grid-column:1/-1">暂无行程记录</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKitchenStore } from '@/stores/kitchen'
import PageHead from '@/components/kitchen/PageHead.vue'
import ProductCard from '@/components/kitchen/ProductCard.vue'

const kitchen = useKitchenStore()
</script>
