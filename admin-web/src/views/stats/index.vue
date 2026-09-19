<template>
  <section class="view on">
    <PageHead title="经营台账" sub="近 7 天 · 支付成功且未退款">
      <div class="toolbar" style="margin:0">
        <button
          v-for="(t, i) in ranges"
          :key="t"
          class="chip"
          :class="{ on: range === i }"
          type="button"
          @click="range = i"
        >{{ t }}</button>
      </div>
    </PageHead>
    <div class="kpi-strip" style="margin-bottom:16px;">
      <div v-for="k in kpis" :key="k.label" class="kpi">
        <b>{{ k.value }}</b>
        <span>{{ k.label }}</span>
      </div>
    </div>
    <div class="two-col">
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">转化漏斗</div>
        <div class="funnel">
          <div v-for="row in funnel" :key="row.label" class="funnel-row">
            <span>{{ row.label }}</span>
            <div class="bar"><b :style="{ width: row.pct + '%' }" /></div>
            <b>{{ row.pct }}%</b>
          </div>
        </div>
      </div>
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">称号分布</div>
        <div class="donut-wrap">
          <div class="donut" />
          <div class="legend">
            <div><b>旅行新手</b> —</div>
            <div><b>探索者</b> —</div>
            <div><b>旅行家</b> —</div>
          </div>
        </div>
        <div class="section-title" style="font-size:15px;margin:16px 0 8px;">心情选择</div>
        <div v-for="row in moods" :key="row.label" class="funnel-row">
          <span>{{ row.label }}</span>
          <div class="bar"><b :style="{ width: row.pct * 2.4 + '%' }" /></div>
          <b>{{ row.pct }}%</b>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHead from '@/components/kitchen/PageHead.vue'

const ranges = ['今日', '近 7 天', '近 30 天']
const range = ref(1)
const kpis = [
  { label: '开盒量', value: '0' },
  { label: '成交额', value: '￥0' },
  { label: '客单价', value: '—' },
  { label: '退款率', value: '—' },
  { label: '新增', value: '0' },
]
const funnel = [
  { label: '访问', pct: 0 },
  { label: '选心情', pct: 0 },
  { label: '浏览盲盒', pct: 0 },
  { label: '点击开盒', pct: 0 },
  { label: '创单', pct: 0 },
  { label: '支付', pct: 0 },
  { label: '开盒完成', pct: 0 },
]
const moods = [
  { label: '开心', pct: 0 },
  { label: 'emo', pct: 0 },
  { label: '无聊', pct: 0 },
  { label: '迷茫', pct: 0 },
]
</script>
