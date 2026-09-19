<template>
  <section class="view on">
    <PageHead title="十二枚印章" sub="解锁人数来自开盒关联线路">
      <button class="btn-sage" type="button" @click="kitchen.editBadge(null)">新建徽章</button>
    </PageHead>
    <div class="badge-grid">
      <article
        v-for="b in kitchen.badges"
        :key="b.name"
        class="badge-card"
      >
        <div class="stamp">{{ b.mark }}</div>
        <div style="font-weight:800;font-size:13px;">{{ b.name }}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">{{ b.unlock }} 人解锁</div>
        <div style="font-size:11px;color:var(--sage-deep);margin-top:2px;">{{ b.routes }} 条线路</div>
        <button class="linkish" type="button" style="margin-top:8px;" @click="kitchen.editBadge(b.id || null)">编辑</button>
      </article>
      <div v-if="!kitchen.badges.length" class="empty" style="grid-column:1/-1">还没有徽章数据</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKitchenStore } from '@/stores/kitchen'
import PageHead from '@/components/kitchen/PageHead.vue'

const kitchen = useKitchenStore()
</script>
