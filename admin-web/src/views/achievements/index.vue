<template>
  <section class="view on">
    <PageHead title="行为成就" sub="条件由服务端计算，后台只维护定义"><button class="btn-sage" type="button" @click="create">新建成就</button></PageHead>
    <div class="kpi-strip">
      <div class="kpi"><b>{{ stats.unlockTotal }}</b><span>累计解锁次数</span></div>
      <div class="kpi"><b>{{ stats.userTotal }}</b><span>正常用户</span></div>
      <div class="kpi"><b>{{ Number(stats.unlockRate).toFixed(1) }}%</b><span>整体达成率</span></div>
    </div>
    <div class="two-col">
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">成就达成排行</div>
        <div v-for="item in stats.byAchievement" :key="item.achievementId" class="kv"><span>{{ item.name }}</span><strong>{{ item.unlockCount }} · {{ Number(item.unlockRate).toFixed(1) }}%</strong></div>
        <div v-if="!stats.byAchievement.length" class="empty">暂无解锁数据</div>
      </div>
      <div class="paper">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">近 7 日解锁</div>
        <div class="spark" aria-label="近七日成就解锁趋势">
          <i v-for="item in stats.dailyTrend" :key="item.date" :title="`${item.date} ${item.count} 次`" :style="{height: trendHeight(item.count)}"></i>
        </div>
        <div class="spark-cap"><span v-for="item in stats.dailyTrend" :key="item.date">{{ item.date.slice(5) }}</span></div>
      </div>
    </div>
    <div class="sheet"><table><thead><tr><th>成就</th><th>条件</th><th>等级</th><th>状态</th><th></th></tr></thead><tbody>
      <tr v-for="row in rows" :key="row.achievementId"><td><strong>{{row.name}}</strong><div class="muted">{{row.code}} · {{row.description}}</div></td><td>{{row.requirementType}} ≥ {{row.requirementValue}}</td><td>{{row.level}}</td><td><span class="pill" :class="row.status === 'on' ? 'ok' : 'wait'">{{row.status}}</span></td><td><button class="linkish" type="button" @click="toggle(row)">{{row.status === 'on' ? '停用' : '启用'}}</button><button class="linkish" type="button" @click="remove(row)">删除</button></td></tr>
      <tr v-if="!loading && !rows.length"><td colspan="5"><div class="empty">暂无成就定义</div></td></tr>
    </tbody></table></div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHead from '@/components/kitchen/PageHead.vue'
import { listAdminAchievements, createAdminAchievement, updateAdminAchievement, deleteAdminAchievement, getAdminAchievementStatistics, type AdminAchievement, type AdminAchievementStatistics } from '@/api/social'
import { toast } from '@/utils/toast'
const rows=ref<AdminAchievement[]>([]), loading=ref(false)
const stats=ref<AdminAchievementStatistics>({ unlockTotal:0, userTotal:0, unlockRate:0, byAchievement:[], dailyTrend:[] })
async function load(){ loading.value=true; try { const [list,summary]=await Promise.all([listAdminAchievements({page:1,pageSize:100}),getAdminAchievementStatistics()]); rows.value=list.data?.list||[]; stats.value=summary.data||stats.value } finally { loading.value=false } }
function trendHeight(value:number){ const max=Math.max(...stats.value.dailyTrend.map(item=>item.count),1); return `${Math.max(8, value / max * 100)}%` }
async function create(){ const name=window.prompt('成就名称'); if(!name)return; const code=window.prompt('唯一 code'); if(!code)return; try { await createAdminAchievement({code,name,description:'',requirementType:'checkin_count',requirementValue:1,level:1,status:'on',sortWeight:0}); toast('成就已创建'); load() } catch {} }
async function toggle(row:AdminAchievement){ try { await updateAdminAchievement(row.achievementId,{code:row.code,name:row.name,description:row.description,requirementType:row.requirementType,requirementValue:row.requirementValue,level:row.level,status:row.status==='on'?'off':'on',sortWeight:0,version:row.version}); load() } catch {} }
async function remove(row:AdminAchievement){ if(!window.confirm('确认停用此成就？'))return; try { await deleteAdminAchievement(row.achievementId); load() } catch {} }
onMounted(load)
</script>
