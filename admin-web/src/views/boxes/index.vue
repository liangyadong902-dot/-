<template>
  <section class="view on">
    <PageHead title="货架上的盒子" sub="售价与保底写在卡片上，像橱窗价签">
      <button class="btn-sage" type="button" @click="kitchen.editBox(null)">新建盲盒</button>
    </PageHead>
    <div class="toolbar">
      <button
        v-for="c in cats"
        :key="c.value"
        class="chip"
        :class="{ on: kitchen.filters.boxCat === c.value }"
        type="button"
        @click="kitchen.filters.boxCat = c.value"
      >{{ c.label }}</button>
      <span style="width:8px" />
      <input
        v-model.trim="kitchen.filters.boxKeyword"
        class="chip"
        style="max-width:180px;"
        placeholder="搜索盲盒名称 / 简介"
      />
      <button
        v-for="s in states"
        :key="s.value"
        class="chip"
        :class="{ on: kitchen.filters.boxSt === s.value }"
        type="button"
        @click="kitchen.filters.boxSt = s.value"
      >{{ s.label }}</button>
    </div>
    <div class="product-grid">
      <ProductCard
        v-for="b in kitchen.filteredBoxes"
        :key="b.id"
        :img="b.img"
        :badge="b.rank"
      >
        <div class="prod-name">{{ b.name }}</div>
        <div class="prod-desc">{{ b.desc }} · {{ b.moods.map((m) => kitchen.moodLabel(m)).join(' / ') }}</div>
        <div class="prod-bottom">
          <div class="prod-price">
            <span>￥</span>{{ b.price }}
            <span style="color:var(--muted);font-size:11px;font-weight:600;">保底 {{ b.guarantee }}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="linkish" type="button" @click="kitchen.editBox(b.id)">编辑</button>
            <button class="linkish" type="button" @click="kitchen.showPool(b.id)">线路池</button>
          </div>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <button
            class="pill"
            :class="b.status === 'on' ? 'ok' : 'wait'"
            type="button"
            @click="kitchen.toggleBox(b.id)"
          >{{ b.status === 'on' ? '上架' : '下架' }}</button>
          <span style="font-size:11px;color:var(--muted);">{{ kitchen.catLabel(b.category) }}</span>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:6px;">
          <button class="linkish" type="button" @click="confirmAction('确定删除这个盲盒吗？') && kitchen.deleteBox(b.id)">删除</button>
        </div>
      </ProductCard>
      <div v-if="!kitchen.filteredBoxes.length" class="empty" style="grid-column:1/-1">{{ kitchen.catalogError || '没有匹配的盒子' }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CAT } from '@/constants/nav'
import { useKitchenStore } from '@/stores/kitchen'
import PageHead from '@/components/kitchen/PageHead.vue'
import ProductCard from '@/components/kitchen/ProductCard.vue'

const kitchen = useKitchenStore()
const cats = [
  { value: 'all', label: '全部' },
  ...Object.entries(CAT).map(([value, label]) => ({ value, label })),
]
const states = [
  { value: 'all', label: '全部状态' },
  { value: 'on', label: '上架' },
  { value: 'off', label: '下架' },
]

function confirmAction(message: string) {
  return window.confirm(message)
}
</script>
