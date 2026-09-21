<template>
  <section class="view on">
    <PageHead title="订单小票" sub="支付宝沙箱 · 本期无微信">
      <button class="btn-ghost" type="button" @click="downloadCsv">导出明细</button>
    </PageHead>
    <div class="toolbar">
      <button v-for="s in states" :key="s.value" class="chip" :class="{ on: status === s.value }" type="button" @click="changeStatus(s.value)">{{ s.label }}</button>
      <span style="width:8px" />
      <input v-model.trim="keyword" class="chip" style="max-width:220px;" placeholder="搜索单号 / 用户 / 手机号 / 盲盒" />
    </div>
    <div class="sheet">
      <table>
        <thead><tr><th>单号</th><th>用户</th><th>盲盒</th><th>实付</th><th>渠道</th><th>状态</th><th>开盒结果</th><th>时间</th><th></th></tr></thead>
        <tbody>
          <tr v-for="o in filteredOrders" :key="o.orderNo">
            <td>{{ o.orderNo }}</td><td>{{ o.userName || `用户${o.userId}` }}<br><small>{{ o.phone }}</small></td><td>{{ o.boxName }}</td>
            <td>￥{{ (o.paidCent / 100).toFixed(2) }}</td><td>{{ o.payChannel || '—' }}</td>
            <td><span class="pill" :class="ORDER_ST[o.status]?.[1]">{{ ORDER_ST[o.status]?.[0] || o.status }}</span></td>
            <td>{{ o.routeName || '—' }}</td><td>{{ o.createdAt }}</td>
            <td><button class="linkish" type="button" @click="showDetail(o.orderNo)">详情</button></td>
          </tr>
          <tr v-if="!loading && !filteredOrders.length"><td colspan="9"><div class="empty">{{ orderError || '暂无订单' }}</div></td></tr>
          <tr v-if="loading"><td colspan="9"><div class="empty">正在读取订单…</div></td></tr>
        </tbody>
      </table>
    </div>
    <PageHead title="支付流水" sub="只读对账数据，不在管理端修改" />
    <div class="sheet">
      <table>
        <thead><tr><th>流水号</th><th>订单号</th><th>渠道</th><th>渠道单号</th><th>金额</th><th>结果</th><th>时间</th></tr></thead>
        <tbody>
          <tr v-for="flow in flows" :key="flow.flowNo">
            <td>{{ flow.flowNo }}</td><td>{{ flow.orderNo }}</td><td>{{ flow.channel }}</td><td>{{ flow.channelTradeNo || '—' }}</td>
            <td>￥{{ (flow.amountCent / 100).toFixed(2) }}</td><td><span class="pill" :class="flow.result === 'success' ? 'ok' : flow.result === 'pending' ? 'wait' : 'bad'">{{ flow.result }}</span></td><td>{{ flow.createdAt }}</td>
          </tr>
          <tr v-if="!flowsLoading && !flows.length"><td colspan="7"><div class="empty">{{ flowError || '暂无支付流水' }}</div></td></tr>
          <tr v-if="flowsLoading"><td colspan="7"><div class="empty">正在读取支付流水…</div></td></tr>
        </tbody>
      </table>
    </div>
    <template v-if="detail">
      <div
        style="position:fixed;inset:0;z-index:60;background:rgba(60,52,44,.45);display:flex;align-items:center;justify-content:center;padding:24px;"
        @click.self="detail = null"
      >
        <div
          class="detail-box"
          style="width:min(560px,94vw);max-height:82vh;overflow:auto;background:var(--paper, #FFFDF8);color:var(--ink, #3C342C);border:1px solid var(--line, #E7DCCE);border-radius:18px;box-shadow:0 24px 64px rgba(60,52,44,.3);padding:22px 24px;"
        >
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
            <b style="font-size:15px;">订单详情</b>
            <span class="pill" :class="ORDER_ST[detail.status]?.[1]" style="white-space:nowrap;">{{ ORDER_ST[detail.status]?.[0] || detail.status }}</span>
            <span style="flex:1"></span>
            <button v-if="detail.status === 'paid' && !detail.tripId" class="btn-ghost" type="button" @click="reopen">补单</button>
            <button class="linkish" type="button" @click="detail = null">关闭</button>
          </div>
          <div style="font-size:12px;color:var(--muted,#8F8376);margin-bottom:14px;word-break:break-all;">{{ detail.orderNo }}</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px 24px;">
            <div><small style="color:var(--muted,#8F8376);">用户</small><div>{{ detail.userName || `用户${detail.userId}` }} · {{ detail.phone || '未绑定手机' }}</div></div>
            <div><small style="color:var(--muted,#8F8376);">盲盒</small><div>{{ detail.boxName }}</div></div>
            <div><small style="color:var(--muted,#8F8376);">售价 / 实付</small><div>￥{{ (detail.priceCent / 100).toFixed(2) }} / ￥{{ (detail.paidCent / 100).toFixed(2) }}</div></div>
            <div><small style="color:var(--muted,#8F8376);">支付渠道</small><div>{{ detail.payChannel || '—' }}</div></div>
            <div><small style="color:var(--muted,#8F8376);">开盒结果</small><div>{{ detail.routeName || '尚未开盒' }}</div></div>
            <div><small style="color:var(--muted,#8F8376);">行程 ID</small><div>{{ detail.tripId ?? '—' }}</div></div>
            <div><small style="color:var(--muted,#8F8376);">下单时间</small><div>{{ detail.createdAt }}</div></div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ORDER_ST } from '@/constants/nav'
import { exportAdminOrders, getAdminOrder, listAdminOrders, listAdminPaymentFlows, reopenAdminOrder, type ApiAdminOrder, type ApiAdminPaymentFlow } from '@/api/transaction'
import PageHead from '@/components/kitchen/PageHead.vue'

const orders = ref<ApiAdminOrder[]>([])
const status = ref('all')
const loading = ref(false)
const orderError = ref('')
const detail = ref<ApiAdminOrder | null>(null)
const flows = ref<ApiAdminPaymentFlow[]>([])
const flowsLoading = ref(false)
const flowError = ref('')
const states = [{ value: 'all', label: '全部' }, { value: 'pending_pay', label: '待支付' }, { value: 'paid', label: '已支付' }, { value: 'opened', label: '已开盒' }, { value: 'cancelled', label: '已取消' }, { value: 'refunded', label: '已退款' }]
const keyword = ref('')
const filteredOrders = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return orders.value
  return orders.value.filter((o) =>
    [o.orderNo, o.userName, o.phone, o.boxName, o.routeName].some((field) => (field || '').toLowerCase().includes(kw)))
})

async function loadOrders() {
  loading.value = true
  orderError.value = ''
  try {
    const result = await listAdminOrders({ status: status.value === 'all' ? undefined : status.value, page: 1, pageSize: 100 })
    orders.value = result.data?.list || []
  } catch {
    orders.value = []
    orderError.value = '订单列表加载失败，请重试'
  } finally {
    loading.value = false
  }
}
async function loadFlows() {
  flowsLoading.value = true
  flowError.value = ''
  try {
    const result = await listAdminPaymentFlows({ page: 1, pageSize: 100 })
    flows.value = result.data?.list || []
  } catch {
    flows.value = []
    flowError.value = '支付流水加载失败，请重试'
  } finally {
    flowsLoading.value = false
  }
}
function changeStatus(value: string) { status.value = value; loadOrders() }
async function showDetail(orderNo: string) { const result = await getAdminOrder(orderNo); detail.value = result.data }
async function reopen() { if (!detail.value) return; const result = await reopenAdminOrder(detail.value.orderNo); detail.value = result.data; await loadOrders() }
async function downloadCsv() { const result = await exportAdminOrders({ status: status.value === 'all' ? undefined : status.value, keyword: keyword.value || undefined }); const url = URL.createObjectURL(result.data); const a = document.createElement('a'); a.href = url; a.download = 'tuge-orders.csv'; a.click(); URL.revokeObjectURL(url) }
onMounted(() => { loadOrders(); loadFlows() })
</script>
