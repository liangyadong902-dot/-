<template>
  <section class="view on">
    <PageHead title="经营台账" sub="真实交易、用户、心情与 AI 使用数据">
      <div class="toolbar" style="margin:0">
        <button v-for="item in ranges" :key="item.days" class="chip" :class="{ on: days === item.days }" type="button" @click="changeRange(item.days)">{{ item.label }}</button>
      </div>
    </PageHead>
    <div v-if="loading" class="sheet"><div class="empty">正在汇总经营数据…</div></div>
    <div v-else-if="error" class="sheet"><div class="empty">{{ error }} <button class="linkish" type="button" @click="load">重试</button></div></div>
    <template v-else>
      <div class="kpi-strip" style="margin-bottom:16px;">
        <div v-for="item in kpis" :key="item.label" class="kpi"><b>{{ item.value }}</b><span>{{ item.label }}</span></div>
      </div>
      <div class="two-col">
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">转化漏斗</div>
          <div v-for="row in userStats?.funnel || []" :key="row.key" class="funnel-row">
            <span>{{ row.label }}</span><div class="bar"><b :style="{ width: barWidth(row.count) }" /></div>
            <b>{{ row.count == null ? '暂无数据' : row.count }}</b>
          </div>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">用户与 AI</div>
          <div class="kv"><span>累计用户</span><strong>{{ userStats?.users.registered || 0 }}</strong></div>
          <div class="kv"><span>新增用户</span><strong>{{ userStats?.users.new || 0 }}</strong></div>
          <div class="kv"><span>活跃用户</span><strong>{{ userStats?.users.active || 0 }}</strong></div>
          <div class="kv"><span>AI 对话人数</span><strong>{{ userStats?.ai.userCount || 0 }}</strong></div>
          <div class="kv"><span>AI 消息数</span><strong>{{ userStats?.ai.messageCount || 0 }}</strong></div>
          <div class="kv"><span>降级比例</span><strong>{{ userStats?.ai.fallbackRate || 0 }}%</strong></div>
          <div v-for="(count, title) in userStats?.titleDistribution || {}" :key="title" class="kv"><span>{{ title }}</span><strong>{{ count }}</strong></div>
        </div>
      </div>
      <div class="two-col" style="margin-top:16px;">
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">心情分布</div>
          <div v-for="(count, mood) in userStats?.moodDistribution || {}" :key="mood" class="kv"><span>{{ moodLabel(String(mood)) }}</span><strong>{{ count }}</strong></div>
          <div v-if="!Object.keys(userStats?.moodDistribution || {}).length" class="empty">暂无心情数据</div>
        </div>
        <div class="paper">
          <div class="section-title" style="font-size:15px;margin-bottom:10px;">热门内容</div>
          <div v-for="item in contentStats?.boxStats || []" :key="item.name" class="kv"><span>{{ item.name }}</span><strong>{{ item.count }} 次</strong></div>
          <div v-if="!contentStats?.boxStats.length" class="empty">暂无开盒数据</div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHead from '@/components/kitchen/PageHead.vue'
import { getContentStats, getPayStats, getUserStats, type AdminContentStats, type AdminPayStats, type AdminUserStats } from '@/api/stats'

const ranges = [{ label: '今日', days: 1 }, { label: '近 7 天', days: 7 }, { label: '近 30 天', days: 30 }]
const days = ref(7)
const loading = ref(false)
const error = ref('')
const userStats = ref<AdminUserStats | null>(null)
const payStats = ref<AdminPayStats | null>(null)
const contentStats = ref<AdminContentStats | null>(null)
const kpis = computed(() => [
  { label: '开盒量', value: String(contentStats.value?.openCount || 0) },
  { label: '成交额', value: `￥${Number(payStats.value?.gmv || 0).toFixed(2)}` },
  { label: '客单价', value: payStats.value?.averageOrderValue == null ? '—' : `￥${Number(payStats.value.averageOrderValue).toFixed(2)}` },
  { label: '退款率', value: `${Number(payStats.value?.refundRate || 0).toFixed(2)}%` },
  { label: '新增用户', value: String(userStats.value?.users.new || 0) },
])

function params() {
  const end = new Date(); const begin = new Date(end); begin.setDate(end.getDate() - days.value + 1)
  const format = (date: Date) => date.toISOString().slice(0, 10)
  return { begin: format(begin), end: format(end) }
}
async function load() {
  loading.value = true; error.value = ''
  try {
    const query = params()
    const [users, pay, content] = await Promise.all([getUserStats(query), getPayStats(query), getContentStats(query)])
    userStats.value = users.data; payStats.value = pay.data; contentStats.value = content.data
  } catch { error.value = '经营数据加载失败' } finally { loading.value = false }
}
function changeRange(value: number) { days.value = value; load() }
function barWidth(value: number | null) {
  if (value == null) return '0%'
  const max = Math.max(...(userStats.value?.funnel || []).map(item => item.count || 0), 1)
  return `${Math.max(3, value / max * 100)}%`
}
function moodLabel(value: string) { return ({ happy: '开心', emo: 'emo', bored: '无聊', curious: '想探索' } as Record<string, string>)[value] || value }
onMounted(load)
</script>
