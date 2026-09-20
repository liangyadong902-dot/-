<template>
  <section class="view on">
    <PageHead title="打卡审核" sub="隐藏打卡只影响公开展示，原始记录仍可追溯">
      <div class="toolbar"><button v-for="s in states" :key="s.value" class="chip" :class="{on:status===s.value}" type="button" @click="change(s.value)">{{s.label}}</button></div>
    </PageHead>
    <div class="kpi-strip">
      <div class="kpi"><b>{{ stats.total }}</b><span>公开打卡</span></div>
      <div class="kpi"><b>{{ stats.newUsers }}</b><span>近 30 天新增用户</span></div>
      <div class="kpi"><b>{{ stats.activeUsers }}</b><span>近 30 天活跃用户</span></div>
    </div>
    <div class="two-col">
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">热门打卡地点</div>
        <div v-for="item in stats.topLocations" :key="item.locationName" class="kv"><span>{{ item.locationName || '未填写地点' }}</span><strong>{{ item.count }}</strong></div>
        <div v-if="!stats.topLocations.length" class="empty">暂无地点数据</div>
      </div>
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">近 7 日趋势</div>
        <div class="spark" aria-label="近七日打卡趋势">
          <i v-for="item in stats.dailyTrend" :key="item.date" :title="`${item.date} ${item.count} 次`" :style="{height: trendHeight(item.count)}"></i>
        </div>
        <div class="spark-cap"><span v-for="item in stats.dailyTrend" :key="item.date">{{ item.date.slice(5) }}</span></div>
      </div>
    </div>
    <div class="sheet">
      <table><thead><tr><th>用户</th><th>地点</th><th>行程</th><th>点赞</th><th>状态</th><th></th></tr></thead><tbody>
        <tr v-for="row in rows" :key="row.checkinId"><td>{{row.user?.nickname || '—'}}</td><td>{{row.locationName}}</td><td>#{{row.tripId || '—'}}</td><td>{{row.likeCount}}</td><td><span class="pill" :class="row.status === 'published' ? 'ok' : 'bad'">{{row.status}}</span></td><td><button class="linkish" type="button" @click="setStatus(row,row.status === 'published' ? 'hidden' : 'published')">{{row.status === 'published' ? '隐藏' : '恢复'}}</button></td></tr>
        <tr v-if="!loading && !rows.length"><td colspan="6"><div class="empty">暂无打卡</div></td></tr>
      </tbody></table>
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHead from '@/components/kitchen/PageHead.vue'
import { listAdminCheckins, updateAdminCheckinStatus, getAdminCheckinStatistics, type AdminCheckin, type AdminCheckinStatistics } from '@/api/social'
import { toast } from '@/utils/toast'
const rows = ref<AdminCheckin[]>([]), loading = ref(false), status = ref('')
const stats = ref<AdminCheckinStatistics>({ total: 0, newUsers: 0, activeUsers: 0, topLocations: [], dailyTrend: [] })
const states = [{value:'',label:'全部'},{value:'published',label:'公开'},{value:'hidden',label:'隐藏'}]
async function load(){ loading.value=true; try { const [list,summary]=await Promise.all([listAdminCheckins({status:status.value||undefined,page:1,pageSize:100}),getAdminCheckinStatistics()]); rows.value=list.data?.list||[]; stats.value=summary.data||stats.value } finally { loading.value=false } }
function change(v:string){ status.value=v; load() }
function trendHeight(value:number){ const max=Math.max(...stats.value.dailyTrend.map(item=>item.count),1); return `${Math.max(8, value / max * 100)}%` }
async function setStatus(row:AdminCheckin,toStatus:string){ try { await updateAdminCheckinStatus(row.checkinId,{toStatus,reason:'运营处理',version:row.version}); toast('打卡状态已更新'); load() } catch {} }
onMounted(load)
</script>
