<template>
  <section class="view on">
    <PageHead title="到店的客人" sub="用户资料、旅行资产与 AI 活跃档案">
      <div class="toolbar" style="margin:0">
        <select v-model="status" class="chip" @change="load(1)"><option value="">全部状态</option><option value="active">正常</option><option value="disabled">已禁用</option></select>
        <select v-model="channel" class="chip" @change="load(1)"><option value="">全部渠道</option><option value="phone">手机号</option><option value="wechat">微信</option></select>
        <input v-model.trim="keyword" class="chip" placeholder="昵称 / 手机号" @keyup.enter="load(1)" />
        <button class="chip" type="button" @click="load(1)">搜索</button>
        <button v-if="canExport" class="btn-sage" type="button" @click="download">导出</button>
      </div>
    </PageHead>
    <div class="sheet">
      <table><thead><tr><th>ID</th><th>昵称 / 微信名</th><th>渠道</th><th>出行</th><th>称号</th><th>累计消费</th><th>省钱</th><th>最近</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="user in users" :key="user.id"><td>{{ user.id }}</td><td><GuestCell :guest="guestOf(user)" /></td><td>{{ channelLabel(user.channel) }}</td><td>{{ user.tripCount }}</td><td><span class="pill">{{ user.title }}</span></td><td>￥{{ Number(user.spendTotal).toFixed(2) }}</td><td>￥{{ Number(user.savedTotal).toFixed(2) }}</td><td>{{ user.lastLoginAt || '—' }}</td><td><span class="pill" :class="user.status === 'active' ? 'ok' : 'bad'">{{ user.status === 'active' ? '正常' : '已禁用' }}</span></td><td><button class="linkish" type="button" @click="openDetail(user.id)">查看</button></td></tr>
          <tr v-if="!loading && !users.length"><td colspan="10"><div class="empty">{{ error || '暂无用户' }}</div></td></tr>
          <tr v-if="loading"><td colspan="10"><div class="empty">正在读取用户…</div></td></tr>
        </tbody>
      </table>
      <div class="toolbar" v-if="total > pageSize"><button class="chip" type="button" :disabled="page <= 1" @click="load(page - 1)">上一页</button><span class="chip">{{ page }} / {{ Math.ceil(total / pageSize) }}</span><button class="chip" type="button" :disabled="page >= Math.ceil(total / pageSize)" @click="load(page + 1)">下一页</button></div>
    </div>

    <KitchenDrawer :open="!!detail" @close="detail = null">
      <div v-if="detail">
        <h3>{{ detail.nickname }}</h3><p style="font-size:12px;color:var(--muted);margin-bottom:12px">{{ detail.title }} · {{ detail.status === 'active' ? '正常' : '已禁用' }}</p>
        <div class="toolbar"><button v-for="(tab, index) in tabs" :key="tab" class="chip" :class="{ on: detailTab === index }" type="button" @click="detailTab = index">{{ tab }}</button></div>
        <div v-if="detailTab === 0"><div class="kv"><span>手机号</span><strong>{{ detail.phone }}</strong></div><div class="kv"><span>渠道</span><strong>{{ channelLabel(detail.channel) }}</strong></div><div class="kv"><span>城市</span><strong>{{ detail.city || '—' }}</strong></div><div class="kv"><span>人格</span><strong>{{ detail.personalityType || '—' }}</strong></div><div class="kv"><span>最近心情</span><strong>{{ detail.recentMood || '—' }}</strong></div></div>
        <div v-else-if="detailTab === 1"><div class="kv"><span>有效行程</span><strong>{{ detail.stats?.tripCount || 0 }}</strong></div><div class="kv"><span>目的地</span><strong>{{ detail.stats?.destinationCount || 0 }}</strong></div><div class="kv"><span>累计消费</span><strong>￥{{ detail.stats?.spendTotal || 0 }}</strong></div><div class="kv"><span>累计省钱</span><strong>￥{{ detail.stats?.savedTotal || 0 }}</strong></div><div class="kv"><span>日记</span><strong>{{ detail.stats?.diaryCount || 0 }}</strong></div></div>
        <div v-else-if="detailTab === 2"><div v-for="trip in detail.recentTrips" :key="trip.id" class="kv"><span>{{ trip.routeName }} · {{ trip.location }}</span><strong>{{ trip.validity }}</strong></div><div v-if="!detail.recentTrips.length" class="empty">暂无行程</div></div>
        <div v-else-if="detailTab === 3"><div v-for="order in detail.recentOrders" :key="order.orderNo" class="kv"><span>{{ order.orderNo }} · {{ order.boxName }}</span><strong>￥{{ (Number(order.paidCent || 0) / 100).toFixed(2) }} · {{ order.status }}</strong></div><div v-if="!detail.recentOrders.length" class="empty">暂无订单</div></div>
        <div v-else><div v-for="badge in detail.badges" :key="badge.id" class="kv"><span>{{ badge.mark }} · {{ badge.name }}</span><strong>{{ badge.unlocked ? '已解锁' : '未解锁' }}</strong></div><div v-if="!detail.badges.length" class="empty">暂无徽章</div></div>
        <div class="field" style="margin-top:18px"><label>客服备注</label><textarea v-model="note" :disabled="!canManage" /></div>
        <div v-if="detail.status === 'active' && canManage" class="field"><label>禁用原因</label><input v-model="disableReason" placeholder="禁用时必填" /></div>
        <div class="toolbar"><button v-if="canManage" class="btn-ghost" type="button" @click="saveNote">保存备注</button><button v-if="canManage" class="btn-ink" type="button" @click="toggleStatus">{{ detail.status === 'active' ? '禁用账号' : '恢复账号' }}</button><button class="btn-ghost" type="button" @click="detail = null">关闭</button></div>
      </div>
    </KitchenDrawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { exportAdminUsers, getAdminUser, listAdminUsers, updateAdminUserNote, updateAdminUserStatus, type ApiAdminUser, type ApiAdminUserDetail } from '@/api/users'
import PageHead from '@/components/kitchen/PageHead.vue'
import GuestCell from '@/components/kitchen/GuestCell.vue'
import KitchenDrawer from '@/components/kitchen/KitchenDrawer.vue'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/toast'
import type { GuestLike } from '@/types/kitchen'

const users = ref<ApiAdminUser[]>([]); const keyword = ref(''); const status = ref(''); const channel = ref(''); const page = ref(1); const pageSize = 20; const total = ref(0); const loading = ref(false); const error = ref('')
const detail = ref<ApiAdminUserDetail | null>(null); const detailTab = ref(0); const note = ref(''); const disableReason = ref(''); const tabs = ['身份', '资产', '行程', '订单', '徽章']
const userStore = useUserStore(); const role = computed(() => userStore.profile?.role || '')
const canManage = computed(() => ['super_admin', 'cs'].includes(role.value)); const canExport = computed(() => ['super_admin', 'finance', 'analyst'].includes(role.value))

async function load(next = page.value) { loading.value = true; error.value = ''; try { const result = await listAdminUsers({ keyword: keyword.value || undefined, status: status.value || undefined, channel: channel.value || undefined, page: next, pageSize }); users.value = result.data?.list || []; total.value = result.data?.total || 0; page.value = next } catch { users.value = []; total.value = 0; error.value = '用户列表加载失败，请重试' } finally { loading.value = false } }
async function openDetail(id: number) { try { const result = await getAdminUser(id); detail.value = result.data; note.value = result.data.csNote || ''; disableReason.value = ''; detailTab.value = 0 } catch { toast('用户档案加载失败') } }
async function saveNote() { if (!detail.value) return; await updateAdminUserNote(detail.value.id, note.value); toast('客服备注已保存'); await openDetail(detail.value.id) }
async function toggleStatus() { if (!detail.value) return; const next = detail.value.status === 'active' ? 'disabled' : 'active'; if (next === 'disabled' && !disableReason.value.trim()) { toast('请填写禁用原因'); return }; await updateAdminUserStatus(detail.value.id, next, disableReason.value); toast(next === 'active' ? '账号已恢复' : '账号已禁用'); await load(page.value); await openDetail(detail.value.id) }
async function download() { const response: any = await exportAdminUsers({ keyword: keyword.value || undefined, status: status.value || undefined, channel: channel.value || undefined }); const blob = response.data instanceof Blob ? response.data : response; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click(); URL.revokeObjectURL(url) }
function channelLabel(value: string) { return value === 'wechat' ? '微信' : value === 'phone' ? '手机' : value || '—' }
function guestOf(user: ApiAdminUser): GuestLike { return { name: user.nickname, wxName: user.wechatNickname || '', phone: user.phone, channel: user.channel } }
onMounted(() => load(1))
</script>
