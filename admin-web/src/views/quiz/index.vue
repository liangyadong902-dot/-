<template>
  <section class="view on">
    <PageHead title="旅行 DNA" sub="选项按 nature / city / adventure / culture 计分" />
    <div class="two-col">
      <div class="sheet">
        <table>
          <thead>
            <tr><th>#</th><th>题干</th><th>选项</th></tr>
          </thead>
          <tbody>
            <tr v-for="q in kitchen.quiz" :key="q.n">
              <td>{{ q.n }}</td>
              <td>{{ q.q }}</td>
              <td style="font-size:12px;color:var(--muted);">{{ q.a.join(' · ') }}</td>
            </tr>
            <tr v-if="!kitchen.quiz.length">
              <td colspan="3"><div class="empty">人格测试接口在阶段二接入</div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="product-grid">
        <ProductCard v-for="p in kitchen.persons" :key="p.type">
          <div class="eyebrow">{{ p.type.toUpperCase() }}</div>
          <div class="prod-name">{{ p.name }}</div>
          <div class="prod-desc">{{ p.rec }}</div>
        </ProductCard>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKitchenStore } from '@/stores/kitchen'
import PageHead from '@/components/kitchen/PageHead.vue'
import ProductCard from '@/components/kitchen/ProductCard.vue'

const kitchen = useKitchenStore()
</script>
