<template>
  <section class="view on">
    <PageHead title="首页横幅" sub="鼠尾草渐变条，右边仍是风景照片">
      <button class="btn-sage" type="button" @click="kitchen.editBanner(null)">新建运营位</button>
    </PageHead>
    <div class="sheet">
      <div
        v-for="b in kitchen.banners"
        :key="b.id"
        class="banner-card"
        style="border-bottom:1px solid var(--line);align-items:center;"
      >
        <img :src="b.img" alt="" />
        <div>
          <div class="kicker" style="font-size:10px;letter-spacing:.14em;color:var(--sage-deep);font-weight:700;">{{ b.tag }}</div>
          <strong>{{ b.title }}</strong>
          <p style="font-size:12px;color:var(--muted);margin-top:4px;">{{ b.sub }}</p>
          <p style="font-size:11px;margin-top:4px;">跳转 {{ b.to }}</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <button class="switch" :class="{ on: b.on }" type="button" @click="kitchen.toggleBanner(b.id)"><i /></button>
          <button class="linkish" type="button" @click="kitchen.editBanner(b.id)">编辑</button>
          <button class="linkish" type="button" @click="confirmAction('确定删除这个运营位吗？') && kitchen.deleteBanner(b.id)">删除</button>
        </div>
      </div>
      <div v-if="!kitchen.banners.length" class="empty">还没有运营位数据</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKitchenStore } from '@/stores/kitchen'
import PageHead from '@/components/kitchen/PageHead.vue'

const kitchen = useKitchenStore()

function confirmAction(message: string) {
  return window.confirm(message)
}
</script>
